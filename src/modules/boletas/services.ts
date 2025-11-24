import type { ServiceResponse } from "@/types/service.js";
import { BoletasRepository } from "./repository.js";
import { TesseractService } from "./ocr/tesseract.service.js";
import { ProductMatcher } from "./matching/product-matcher.js";
import { SupermarketDetector } from "./ai/supermarket-detector.js";
import { DeepSeekClientService } from "@/lib/clients/deepseek.js";
import { clasificarImpactoProducto } from "./validation/impactClassifier.js";
import { validarCO2 } from "./validation/tablaMaestra.js";
import { normalizarCantidadAKg } from "./validation/normalizador-unidades.js";
import { ValidationError, NotFoundError } from "@/config/errors/errors.js";
import logger from "@/config/logger.js";
import type { BoletaTipoAmbiental } from "@prisma/client";
import type {
  ProcesarBoletaResponse,
  ProductoExtraido,
  ProductoClasificado,
  AnalisisBoleta,
  GetBoletaParams,
  DetalleBoletaResponse,
  ProductoDetalle,
  RecomendacionItem,
  GetRecommendationsResponse,
} from "./schemas.js";

import { RecommendationsService } from "./recommendations/recommendations.service.js";

function esProductoVerde(
  producto: ProductoClasificado,
  supermercado: string
): boolean {
  const impacto = clasificarImpactoProducto(
    supermercado,
    producto.categoria,
    producto.factorCo2
  );

  logger.debug("Producto clasificado", {
    nombre: producto.nombre,
    categoria: producto.categoria,
    co2: producto.factorCo2,
    impacto: impacto.nivel,
    esEco: impacto.esEco,
  });

  return impacto.esEco || producto.esLocal || producto.tieneEmpaqueEcologico;
}

async function matchProductos(
  productosOCR: ProductoExtraido[],
  collectionName: string
): Promise<ProductoClasificado[]> {
  const productosClasificados: ProductoClasificado[] = [];

  for (const productoOCR of productosOCR) {
    const validarCO2Flag = true;
    const match = await ProductMatcher.findSimilarProduct(
      productoOCR.nombre,
      collectionName,
      validarCO2Flag
    );


    if (match) {
      let cantidadEnKg: number;
      const unidad = productoOCR.unidad || 'kg';
      const unidadLower = unidad.toLowerCase().trim();

      if (['kg', 'g', 'ml', 'l'].includes(unidadLower)) {
        cantidadEnKg = normalizarCantidadAKg(
          productoOCR.cantidad,
          unidad,
          match.categoria
        );
        logger.debug('✅ Producto con peso en boleta, solo convirtiendo unidades', {
          nombre: productoOCR.nombre,
          cantidadOriginal: productoOCR.cantidad,
          unidadOriginal: unidad,
          cantidadNormalizada: cantidadEnKg,
        });
      }
      else if (['un', 'unidad', 'unidades'].includes(unidadLower)) {
        cantidadEnKg = normalizarCantidadAKg(
          productoOCR.cantidad,
          unidad,
          match.categoria
        );
        logger.warn('⚠️ Producto sin peso en boleta, estimando por categoría', {
          nombre: productoOCR.nombre,
          cantidadUnidades: productoOCR.cantidad,
          categoria: match.categoria,
          pesoEstimado: cantidadEnKg,
        });
      }
      else {
        cantidadEnKg = productoOCR.cantidad;
        logger.warn('⚠️ Unidad no reconocida, usando cantidad directa', {
          nombre: productoOCR.nombre,
          cantidad: productoOCR.cantidad,
          unidad: unidad,
        });
      }

      const co2Calculado = match.factorCo2 * cantidadEnKg;

      const subcategoria = match.subcategoria || match.categoria;
      const validacion = validarCO2(subcategoria, match.factorCo2, cantidadEnKg);

      logger.debug('✅ Producto matched y validado', {
        nombre: productoOCR.nombre,
        cantidadOriginal: productoOCR.cantidad,
        unidadOriginal: productoOCR.unidad,
        cantidadNormalizada: cantidadEnKg,
        subcategoria,
        huella: match.factorCo2,
        co2Calculado,
        nivel: validacion.nivel
      });

      productosClasificados.push({
        ...match,
        precio: productoOCR.precio,
        cantidad: cantidadEnKg,
        confianza: match.confianza,
        validacion,
      });
    } else {
      logger.warn("⚠️ Producto no encontrado en Qdrant", {
        nombre: productoOCR.nombre,
        collection: collectionName,
      });

      const co2Calculado = 5.0 * productoOCR.cantidad;
      const validacion = validarCO2("Sin categoría", 5.0, productoOCR.cantidad);

      productosClasificados.push({
        ...productoOCR,
        categoria: "Sin categoría",
        factorCo2: 5.0,
        esLocal: false,
        tieneEmpaqueEcologico: false,
        validacion,
      });
    }
  }

  return productosClasificados;
}
function analizarBoleta(
  productos: ProductoClasificado[],
  supermercado: string
): AnalisisBoleta {
  const totalProductos = productos.length;

  const productosVerdes = productos.filter((p) => {
    if (p.validacion) {
      return p.validacion.nivel === 'verde';
    }
    return esProductoVerde(p, supermercado);
  }).length;

  const porcentajeVerde = (productosVerdes / totalProductos) * 100;

  const co2Total = productos.reduce(
    (sum, p) => sum + p.factorCo2 * p.cantidad,
    0
  );
  const co2Promedio = co2Total / totalProductos;

  let tipoAmbiental: "VERDE" | "AMARILLO" | "ROJO";
  if (totalProductos < 5) {
    // Boletas con menos de 5 productos nunca se clasifican como VERDE
    if (porcentajeVerde >= 30) {
      tipoAmbiental = "AMARILLO";
    } else {
      tipoAmbiental = "ROJO";
    }
  } else {
    if (porcentajeVerde >= 60) {
      tipoAmbiental = "VERDE";
    } else if (porcentajeVerde >= 30) {
      tipoAmbiental = "AMARILLO";
    } else {
      tipoAmbiental = "ROJO";
    }
  }

  const esReciboVerde = tipoAmbiental === "VERDE";

  logger.info('📊 Análisis de boleta completado', {
    totalProductos,
    productosVerdes,
    porcentajeVerde: Math.round(porcentajeVerde),
    co2Total: Math.round(co2Total * 100) / 100,
    tipoAmbiental
  });

  return {
    totalProductos,
    productosVerdes,
    porcentajeVerde: Math.round(porcentajeVerde),
    co2Total: Math.round(co2Total * 100) / 100,
    co2Promedio: Math.round(co2Promedio * 100) / 100,
    tipoAmbiental,
    esReciboVerde,
  };
}

async function procesarBoleta(
  userId: string,
  imageBuffer: Buffer,
  fileName: string,
  generateSuggestions: boolean = false
): Promise<ServiceResponse<ProcesarBoletaResponse>> {
  try {
    logger.info("🚀 Iniciando procesamiento de boleta", { userId, fileName });
    logger.info("📸 Paso 1: Extrayendo texto con OCR...");
    const textoOCR = await TesseractService.extractText(imageBuffer);

    logger.info("📝 Texto extraído del OCR (completo):", {
      caracteres: textoOCR.length,
      lineas: textoOCR.split("\n").length,
    });
    logger.debug("📄 Contenido OCR:", {
      texto: textoOCR,
    });

    logger.info("📄 Preview del texto OCR (primeras 500 chars):", {
      preview: textoOCR.substring(0, 500),
    });

    logger.info("🏪 Paso 2: Detectando supermercado con patrones...");
    const collectionName = SupermarketDetector.detectSupermercado(textoOCR);
    logger.info(`✅ Colección seleccionada: ${collectionName}`);

    const productosOCR = TesseractService.parseProductosFromText(textoOCR);

    if (productosOCR.length === 0) {
      throw new ValidationError("No se detectaron productos en la imagen");
    }

    logger.info("✅ Productos extraídos del OCR", {
      cantidad: productosOCR.length,
    });

    logger.info("🔍 Paso 3: Buscando productos en base de datos...");
    const productosClasificados = await matchProductos(
      productosOCR,
      collectionName
    );

    logger.info("📊 Paso 4: Analizando impacto ambiental...");
    const analisis = analizarBoleta(productosClasificados, collectionName);

    let sugerencias: string[] = [];

    logger.info("💾 Paso 5: Guardando en base de datos...");
    const boleta = await BoletasRepository.createBoleta({
      usuarioId: userId,
      nombreTienda: collectionName,
      fechaBoleta: new Date(),
      total: productosClasificados.reduce((sum, p) => sum + p.precio, 0),
      tipoAmbiental: analisis.tipoAmbiental as BoletaTipoAmbiental,
      urlImagen: fileName,
    });

    // Resolver IDs de categorías, subcategorías y marcas
    const productosConIds = await Promise.all(
      productosClasificados.map(async (p) => {
        const marcaId = p.marcaId
          ? p.marcaId
          : await BoletasRepository.findOrCreateMarca(p.marca || null);

        const categoriaId = await BoletasRepository.findOrCreateCategoria(p.categoria);
        const subcategoriaId = await BoletasRepository.findOrCreateSubcategoria(
          p.subcategoria,
          categoriaId
        );

        return {
          nombreProducto: p.nombre,
          cantidad: p.cantidad,
          precioUnitario: p.precio,
          factorCo2: p.factorCo2,
          categoriaId,
          subcategoriaId,
          marcaId,
        };
      })
    );

    await BoletasRepository.createBoletaItems(boleta.Id, productosConIds);



    if (analisis.esReciboVerde) {
      await BoletasRepository.updatePuntosVerdes(userId, 1);
      logger.info("✅ Recibo verde detectado - Punto agregado");
    }

    if (generateSuggestions) {
      logger.info("💡 Generando sugerencias ecológicas con IA...");

      const productosConCO2 = productosClasificados.map(p => ({
        nombre: p.nombre,
        co2: p.factorCo2 * p.cantidad,
        nivel: p.validacion?.nivel
      }));

      sugerencias = await DeepSeekClientService.generateSuggestions(
        productosConCO2,
        {
          co2Total: analisis.co2Total,
          tipoAmbiental: analisis.tipoAmbiental
        }
      );
    } else {
      logger.info("⏭️ Sugerencias omitidas (no solicitadas)");
    }

    logger.info("🎉 Boleta procesada exitosamente", { boletaId: boleta.Id });

    return {
      message: "Boleta procesada exitosamente",
      data: {
        boletaId: boleta.Id,
        analisis,
        productos: productosClasificados,
        sugerencias,
      },
    };
  } catch (error) {
    logger.error("❌ Error procesando boleta", { userId, error });
    throw error;
  }
}
async function getBoletaDetalle(
  params: GetBoletaParams
): Promise<ServiceResponse<DetalleBoletaResponse>> {
  const boleta = await BoletasRepository.getBoletaById(params.boletaId);

  if (!boleta) {
    throw new NotFoundError("Boleta no encontrada");
  }

  const productos: ProductoDetalle[] = boleta.Items.map((item) => ({
    id: item.Id,
    nombre: item.NombreProducto,
    cantidad: Number(item.Cantidad),
    precioUnitario: Number(item.PrecioUnitario),
    precioTotal: Number(item.PrecioTotal),
    factorCo2: Number(item.FactorCo2PorUnidad),
    categoria: item.Categoria?.Nombre ?? null,
    subcategoria: item.Subcategoria?.Nombre ?? null,
    marca: item.Marca?.Nombre ?? null,
  }));

  const totalProductos = productos.length;
  const co2Total = productos.reduce(
    (sum, p) => sum + p.factorCo2 * p.cantidad,
    0
  );
  const co2Promedio = totalProductos > 0 ? co2Total / totalProductos : 0;

  const detalle: DetalleBoletaResponse = {
    id: boleta.Id,
    fechaBoleta: boleta.FechaBoleta,
    nombreTienda: boleta.Tienda?.Nombre ?? boleta.NombreTienda,
    logoTienda: boleta.Tienda?.UrlLogo ?? null,
    total: Number(boleta.Total),
    tipoAmbiental: boleta.TipoAmbiental,
    urlImagen: boleta.UrlImagen,
    productos,
    analisis: {
      totalProductos,
      co2Total: Math.round(co2Total * 100) / 100,
      co2Promedio: Math.round(co2Promedio * 100) / 100,
    },
  };

  logger.info("Detalle de boleta obtenido", {
    boletaId: params.boletaId,
  });

  return {
    message: "Detalle de boleta obtenido exitosamente",
    data: detalle,
  };
}

async function getBoletaRecommendations(
  params: GetBoletaParams
): Promise<ServiceResponse<GetRecommendationsResponse>> {
  const boleta = await BoletasRepository.getBoletaById(params.boletaId);

  if (!boleta) {
    throw new NotFoundError("Boleta no encontrada");
  }

  let recomendaciones: RecomendacionItem[] = [];
  let generadoEn = new Date();

  for (const item of boleta.Items) {
    if (item.Recomendaciones && item.Recomendaciones.length > 0) {
      for (const rec of item.Recomendaciones) {
        const co2Ahorrado = Number(rec.Co2Original) - Number(rec.Co2Recomendado);

        recomendaciones.push({
          id: rec.Id,
          productoOriginal: {
            id: item.Id,
            nombre: item.NombreProducto || "Producto sin nombre",
            co2: Number(item.FactorCo2PorUnidad),
          },
          productoRecomendado: {
            nombre: rec.ProductoRecomendadoNombre,
            marca: rec.Marca?.Nombre ?? null,
            categoria: rec.Categoria?.Nombre ?? null,
            tienda: rec.TiendaOrigen,
            co2: Number(rec.Co2Recomendado),
          },
          mejora: {
            porcentaje: Number(rec.PorcentajeMejora),
            co2Ahorrado,
          },
          tipo: rec.TipoRecomendacion,
          scoreSimilitud: Number(rec.ScoreSimilitud),
        });
      }
    }
  }

  if (recomendaciones.length === 0) {
    logger.info("🌱 No hay recomendaciones, generando...", {
      boletaId: params.boletaId,
    });

    const productosConIds = await BoletasRepository.getProductosByBoletaId(boleta.Id);
    const recomendacionesParaGuardar = [];

    for (const productoDb of productosConIds) {
      if (Number(productoDb.FactorCo2PorUnidad) > 3.0) {
        const producto: ProductoClasificado = {
          nombre: productoDb.NombreProducto || "Producto",
          precio: 0,
          cantidad: Number(productoDb.Cantidad),
          unidad: "kg",
          confianza: 1.0,
          categoria: "Sin categoría",
          subcategoria: "Sin categoría",
          marcaId: undefined,
          factorCo2: Number(productoDb.FactorCo2PorUnidad),
          esLocal: false,
          tieneEmpaqueEcologico: false,
        };

        const alternativas = await RecommendationsService.findAlternatives(
          producto,
          boleta.NombreTienda || "tottus",
          true
        );

        for (const alternativa of alternativas) {
          const porcentajeMejora =
            ((producto.factorCo2 - alternativa.co2) / producto.factorCo2) * 100;

          const co2Ahorrado = producto.factorCo2 - alternativa.co2;

          recomendacionesParaGuardar.push({
            productoOriginalId: productoDb.Id,
            productoRecomendadoNombre: alternativa.nombre,
            productoRecomendadoMarcaId: undefined,
            productoRecomendadoCategoriaId: undefined,
            tiendaOrigen: alternativa.tienda,
            co2Original: producto.factorCo2,
            co2Recomendado: alternativa.co2,
            porcentajeMejora,
            tipoRecomendacion: alternativa.tipo,
            scoreSimilitud: alternativa.scoreSimilitud,
          });

          recomendaciones.push({
            id: "",
            productoOriginal: {
              id: productoDb.Id,
              nombre: productoDb.NombreProducto || "Producto",
              co2: producto.factorCo2,
            },
            productoRecomendado: {
              nombre: alternativa.nombre,
              marca: alternativa.marca,
              categoria: alternativa.categoria,
              tienda: alternativa.tienda,
              co2: alternativa.co2,
            },
            mejora: {
              porcentaje: porcentajeMejora,
              co2Ahorrado,
            },
            tipo: alternativa.tipo,
            scoreSimilitud: alternativa.scoreSimilitud,
          });
        }
      }
    }

    if (recomendacionesParaGuardar.length > 0) {
      await BoletasRepository.createRecomendaciones(
        boleta.Id,
        recomendacionesParaGuardar
      );
      logger.info(`✅ ${recomendacionesParaGuardar.length} recomendaciones generadas y guardadas`);
    }
  }

  const co2TotalAhorrable = recomendaciones.reduce(
    (sum, r) => sum + r.mejora.co2Ahorrado,
    0
  );
  const porcentajeMejoraPromedio =
    recomendaciones.length > 0
      ? recomendaciones.reduce((sum, r) => sum + r.mejora.porcentaje, 0) /
      recomendaciones.length
      : 0;

  return {
    message: "Recomendaciones obtenidas exitosamente",
    data: {
      boletaId: boleta.Id,
      recomendaciones,
      resumen: {
        totalRecomendaciones: recomendaciones.length,
        co2TotalAhorrable: Math.round(co2TotalAhorrable * 100) / 100,
        porcentajeMejoraPromedio: Math.round(porcentajeMejoraPromedio * 100) / 100,
      },
      generadoEn,
    },
  };
}

export const BoletasService = {
  procesarBoleta,
  getBoletaDetalle,
  getBoletaRecommendations,
};
