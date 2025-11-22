import type { ServiceResponse } from "@/types/service.js";
import { BoletasRepository } from "./repository.js";
import { TesseractService } from "./ocr/tesseract.service.js";
import { ProductMatcher } from "./ai/product-matcher.js";
import { SupermarketDetector } from "./ai/supermarket-detector.js";
import { DeepSeekClientService } from "@/lib/clients/deepseek.js";
import { clasificarImpactoProducto } from "./utils/impactClassifier.js";
import { validarCO2 } from "./utils/tablaMaestra.js";
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
} from "./schemas.js";

import { RecommendationsService } from "./ai/recommendations.service.js";

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
      // ✅ Calcular CO2 con peso real de la boleta
      const co2Calculado = match.factorCo2 * productoOCR.cantidad;

      // ✅ Validar con tabla_maestra usando subcategoría
      const subcategoria = match.subcategoria || match.categoria;
      const validacion = validarCO2(subcategoria, co2Calculado);

      logger.debug('✅ Producto matched y validado', {
        nombre: productoOCR.nombre,
        subcategoria,
        peso: productoOCR.cantidad,
        huella: match.factorCo2,
        co2Calculado,
        nivel: validacion.nivel
      });

      productosClasificados.push({
        ...match,
        precio: productoOCR.precio,
        cantidad: productoOCR.cantidad,  // ✅ Peso real de la boleta
        confianza: match.confianza,
        validacion,  // ✅ NUEVO: Validación con tabla_maestra
      });
    } else {
      logger.warn("⚠️ Producto no encontrado en Qdrant", {
        nombre: productoOCR.nombre,
        collection: collectionName,
      });

      // ✅ Producto no encontrado: usar valores por defecto
      const co2Calculado = 5.0 * productoOCR.cantidad;
      const validacion = validarCO2("Sin categoría", co2Calculado);

      productosClasificados.push({
        ...productoOCR,
        categoria: "Sin categoría",
        factorCo2: 5.0,
        esLocal: false,
        tieneEmpaqueEcologico: false,
        validacion,  // ✅ Validación por defecto
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

  // ✅ NUEVO: Contar productos verdes usando validación de tabla_maestra
  // Los productos ya vienen con el campo validacion desde matchProductos
  const productosVerdes = productos.filter((p) => {
    // Si tiene validación de tabla_maestra, usar ese nivel
    if (p.validacion) {
      return p.validacion.nivel === 'verde';
    }
    // Fallback: usar lógica anterior
    return esProductoVerde(p, supermercado);
  }).length;

  const porcentajeVerde = (productosVerdes / totalProductos) * 100;

  // ✅ Calcular CO2 total (peso_real × huella_categoria)
  const co2Total = productos.reduce(
    (sum, p) => sum + p.factorCo2 * p.cantidad,
    0
  );
  const co2Promedio = co2Total / totalProductos;

  // ✅ Clasificar boleta según porcentaje de productos verdes
  let tipoAmbiental: "VERDE" | "AMARILLO" | "ROJO";
  if (porcentajeVerde >= 60) {
    tipoAmbiental = "VERDE";
  } else if (porcentajeVerde >= 30) {
    tipoAmbiental = "AMARILLO";
  } else {
    tipoAmbiental = "ROJO";
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
  generateSuggestions: boolean = false // ✅ Parámetro opcional
): Promise<ServiceResponse<ProcesarBoletaResponse>> {
  try {
    logger.info("🚀 Iniciando procesamiento de boleta", { userId, fileName });

    // ✅ PASO 1: Extracción de texto con OCR
    logger.info("📸 Paso 1: Extrayendo texto con OCR...");
    const textoOCR = await TesseractService.extractText(imageBuffer);

    // ✅ NUEVO: Logger para mostrar texto extraído completo
    logger.info("📝 Texto extraído del OCR (completo):", {
      caracteres: textoOCR.length,
      lineas: textoOCR.split("\n").length,
    });
    logger.debug("📄 Contenido OCR:", {
      texto: textoOCR, // ✅ Muestra el texto completo en modo debug
    });

    // Si quieres verlo en modo INFO (para producción), usa esto:
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

    // ✅ Sugerencias opcionales (solo si se solicita)
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

    await BoletasRepository.createBoletaItems(
      boleta.Id,
      productosClasificados.map((p) => ({
        nombreProducto: p.nombre,
        cantidad: p.cantidad,
        precioUnitario: p.precio,
        factorCo2: p.factorCo2,
        categoriaId: undefined,
        subcategoriaId: undefined,
        marcaId: p.marcaId,
      }))
    );

    // ✅ PASO 7: Generar recomendaciones (REFACTORIZADO)
    logger.info("🌱 Paso 7: Generando recomendaciones de productos...");

    // ✅ Obtener IDs de productos desde repository
    const productosConIds = await BoletasRepository.getProductosByBoletaId(
      boleta.Id
    );

    const recomendacionesParaGuardar = [];

    for (let i = 0; i < productosClasificados.length; i++) {
      const producto = productosClasificados[i];
      const productoDb = productosConIds[i];

      // Solo recomendar para productos con CO2 > 3.0
      if (producto.factorCo2 > 3.0) {
        const alternativas = await RecommendationsService.findAlternatives(
          producto,
          collectionName,
          true
        );

        for (const alternativa of alternativas) {
          const porcentajeMejora =
            ((producto.factorCo2 - alternativa.co2) / producto.factorCo2) * 100;

          recomendacionesParaGuardar.push({
            productoOriginalId: productoDb.Id,
            productoRecomendadoNombre: alternativa.nombre,
            productoRecomendadoMarcaId: undefined,
            productoRecomendadoCategoriaId: undefined,
            tiendaOrigen: alternativa.tienda,
            co2Original: producto.factorCo2,
            co2Recomendado: alternativa.co2,
            porcentajeMejora,
            tipoRecomendacion:
              alternativa.tienda === collectionName
                ? ("ALTERNATIVA_MISMA_TIENDA" as const)
                : ("ALTERNATIVA_OTRA_TIENDA" as const),
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
      logger.info(
        `✅ ${recomendacionesParaGuardar.length} recomendaciones guardadas`
      );
    }

    if (analisis.esReciboVerde) {
      await BoletasRepository.updatePuntosVerdes(userId, 1);
      logger.info("✅ Recibo verde detectado - Punto agregado");
    }

    // ✅ PASO 6: Generar sugerencias ecológicas (OPCIONAL)
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

  // Transformar productos
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

  // ✅ NUEVO: Transformar recomendaciones
  const recomendaciones: RecomendacionItem[] = [];

  for (const item of boleta.Items) {
    for (const rec of item.Recomendaciones || []) {
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

  // Calcular análisis
  const totalProductos = productos.length;
  const co2Total = productos.reduce(
    (sum, p) => sum + p.factorCo2 * p.cantidad,
    0
  );
  const co2Promedio = totalProductos > 0 ? co2Total / totalProductos : 0;

  // ✅ NUEVO: Resumen de recomendaciones
  const co2TotalAhorrable = recomendaciones.reduce(
    (sum, r) => sum + r.mejora.co2Ahorrado,
    0
  );
  const porcentajeMejoraPromedio =
    recomendaciones.length > 0
      ? recomendaciones.reduce((sum, r) => sum + r.mejora.porcentaje, 0) /
      recomendaciones.length
      : 0;

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
    // ✅ NUEVO
    recomendaciones,
    resumenRecomendaciones: {
      totalRecomendaciones: recomendaciones.length,
      co2TotalAhorrable: Math.round(co2TotalAhorrable * 100) / 100,
      porcentajeMejoraPromedio:
        Math.round(porcentajeMejoraPromedio * 100) / 100,
    },
  };

  logger.info("Detalle de boleta obtenido con recomendaciones", {
    boletaId: params.boletaId,
    recomendaciones: recomendaciones.length,
  });

  return {
    message: "Detalle de boleta obtenido exitosamente",
    data: detalle,
  };
}

export const BoletasService = {
  procesarBoleta,
  getBoletaDetalle,
};
