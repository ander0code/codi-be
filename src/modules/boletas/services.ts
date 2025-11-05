import type { ServiceResponse } from '@/types/service.js';
import { BoletasRepository } from './repository.js';
import { TesseractService } from './ocr/tesseract.service.js';
import { ProductMatcher } from './ai/product-matcher.js';
import { SupermarketDetector } from './ai/supermarket-detector.js';
import { DeepSeekClientService } from '@/lib/clients/deepseek.js';
import { clasificarImpactoProducto } from './utils/impactClassifier.js';
import { ValidationError } from '@/config/errors/errors.js';
import logger from '@/config/logger.js';
import type { BoletaTipoAmbiental } from '@prisma/client';
import type { 
    ProcesarBoletaResponse,
    ProductoExtraido,
    ProductoClasificado,
    AnalisisBoleta
} from './schemas.js';

function esProductoVerde(producto: ProductoClasificado, supermercado: string): boolean {
    const impacto = clasificarImpactoProducto(
        supermercado,
        producto.categoria,
        producto.factorCo2
    );

    logger.debug('Producto clasificado', {
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
        const validarCO2 = true;
        const match = await ProductMatcher.findSimilarProduct(
            productoOCR.nombre, 
            collectionName, 
            validarCO2
        );

        if (match) {
            productosClasificados.push({
                ...match,
                precio: productoOCR.precio,
                cantidad: productoOCR.cantidad,
                confianza: match.confianza,
            });
        } else {
            logger.warn('⚠️ Producto no encontrado en Qdrant', {
                nombre: productoOCR.nombre,
                collection: collectionName,
            });

            productosClasificados.push({
                ...productoOCR,
                categoria: 'Sin categoría',
                factorCo2: 5.0,
                esLocal: false,
                tieneEmpaqueEcologico: false,
            });
        }
    }

    return productosClasificados;
}

function analizarBoleta(productos: ProductoClasificado[], supermercado: string): AnalisisBoleta {
    const totalProductos = productos.length;
    const productosVerdes = productos.filter((p) => esProductoVerde(p, supermercado)).length;

    const porcentajeVerde = (productosVerdes / totalProductos) * 100;
    const co2Total = productos.reduce((sum, p) => sum + p.factorCo2 * p.cantidad, 0);
    const co2Promedio = co2Total / totalProductos;

    let tipoAmbiental: 'VERDE' | 'AMARILLA' | 'ROJA';
    if (porcentajeVerde >= 60 && co2Promedio < 4.0) {
        tipoAmbiental = 'VERDE';
    } else if (porcentajeVerde >= 30 && co2Promedio < 7.0) {
        tipoAmbiental = 'AMARILLA';
    } else {
        tipoAmbiental = 'ROJA';
    }

    const esReciboVerde = porcentajeVerde >= 60 && co2Promedio < 4.0;

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
    fileName: string
): Promise<ServiceResponse<ProcesarBoletaResponse>> {
    try {
        logger.info('🚀 Iniciando procesamiento de boleta', { userId, fileName });
        
        logger.info('📸 Paso 1: Extrayendo texto con OCR...');
        const textoOCR = await TesseractService.extractText(imageBuffer);
        
        logger.info('🏪 Paso 2: Detectando supermercado con patrones...');
        const collectionName = SupermarketDetector.detectSupermercado(textoOCR);
        logger.info(`✅ Colección seleccionada: ${collectionName}`);
        
        const productosOCR = TesseractService.parseProductosFromText(textoOCR);
        
        if (productosOCR.length === 0) {
            throw new ValidationError('No se detectaron productos en la imagen');
        }
        
        logger.info('✅ Productos extraídos del OCR', { cantidad: productosOCR.length });
        
        logger.info('🔍 Paso 3: Buscando productos en base de datos...');
        const productosClasificados = await matchProductos(productosOCR, collectionName);
        
        logger.info('📊 Paso 4: Analizando impacto ambiental...');
        const analisis = analizarBoleta(productosClasificados, collectionName);
        
        logger.info('💡 Paso 5: Generando sugerencias ecológicas con IA...');
        const nombresProductos = productosClasificados.map(p => p.nombre);
        const sugerencias = await DeepSeekClientService.generateSuggestions(nombresProductos);
        
        logger.info('💾 Paso 6: Guardando en base de datos...');
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
            productosClasificados.map(p => ({
                nombreProducto: p.nombre,
                cantidad: p.cantidad,
                precioUnitario: p.precio,
                factorCo2: p.factorCo2,
                categoriaId: undefined,
                subcategoriaId: undefined,
                marcaId: p.marcaId,
            }))
        );
        
        if (analisis.esReciboVerde) {
            await BoletasRepository.updatePuntosVerdes(userId, 1);
            logger.info('✅ Recibo verde detectado - Punto agregado');
        }
        
        logger.info('🎉 Boleta procesada exitosamente', { boletaId: boleta.Id });
        
        return {
            message: 'Boleta procesada exitosamente',
            data: {
                boletaId: boleta.Id,
                analisis,
                productos: productosClasificados,
                sugerencias,
            },
        };
    } catch (error) {
        logger.error('❌ Error procesando boleta', { userId, error });
        throw error;
    }
}

export const BoletasService = {
    procesarBoleta,
};