// ALGORITMO FINAL - Usando Bounding Boxes para orden correcto
// Ejecutar con: npx tsx test-ocr-parser.ts

import { readFileSync } from 'fs';
import sharp from 'sharp';
import { googleVisionClient } from './src/lib/clients/google-vision.js';

interface TextBlock {
    text: string;
    x: number;
    y: number;
}

interface Producto {
    lineaIndex: number;
    codigo: string;
    nombre: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number | null;
    precioTotal: number | null;
}

/**
 * Valida la calidad del OCR basándose en métricas de Google Vision
 * Retorna true si la calidad es aceptable, false si es muy mala
 */
function validarCalidadOCR(fullTextAnnotation: any): { esValida: boolean; razon?: string; confianza?: number; numProductos?: number } {
    // 1. Verificar que hay texto detectado
    if (!fullTextAnnotation || !fullTextAnnotation.text || fullTextAnnotation.text.trim().length < 50) {
        return {
            esValida: false,
            razon: 'No se detectó suficiente texto en la imagen'
        };
    }

    // 2. Verificar confianza de Google Vision (umbral más estricto: 70%)
    const confianza = fullTextAnnotation.pages?.[0]?.confidence;
    if (confianza !== undefined && confianza < 0.70) {
        return {
            esValida: false,
            razon: 'La calidad de la imagen es muy baja para procesamiento confiable',
            confianza: Math.round(confianza * 100)
        };
    }

    // 3. Verificar número de bloques detectados
    const numBloques = fullTextAnnotation.pages?.[0]?.blocks?.length || 0;
    if (numBloques < 10) {
        return {
            esValida: false,
            razon: 'La imagen está muy borrosa o tiene muy poco contenido legible',
            confianza: confianza ? Math.round(confianza * 100) : undefined
        };
    }

    // 4. Verificar que se detectaron códigos de barras (indicador de productos)
    const texto = fullTextAnnotation.text;
    const codigosBarras = texto.match(/\d{13}/g);
    const numProductos = codigosBarras ? codigosBarras.length : 0;

    if (numProductos === 0) {
        return {
            esValida: false,
            razon: 'No se detectaron códigos de barras. La imagen puede estar muy borrosa o no es una boleta válida',
            confianza: confianza ? Math.round(confianza * 100) : undefined
        };
    }

    // 5. Verificar que hay al menos 2 productos (boletas muy pequeñas pueden ser sospechosas)
    if (numProductos < 2) {
        return {
            esValida: false,
            razon: 'Se detectó muy poco contenido. Por favor, asegúrate de capturar toda la boleta',
            confianza: confianza ? Math.round(confianza * 100) : undefined,
            numProductos
        };
    }

    return {
        esValida: true,
        confianza: confianza ? Math.round(confianza * 100) : undefined,
        numProductos
    };
}

/**
 * Preprocesa la imagen para mejorar la calidad del OCR (OPTIMIZADO)
 * - Operaciones reducidas para mejor rendimiento
 * - Mantiene calidad aceptable
 */
async function preprocesarImagen(imageBuffer: Buffer): Promise<Buffer> {
    console.log('🔧 Preprocesando imagen (optimizado)...');

    try {
        const processedBuffer = await sharp(imageBuffer)
            // 1. Resize moderado (reducido de 3000 a 2000)
            .resize({
                width: 2000,
                fit: 'inside',
                withoutEnlargement: true,
                kernel: 'mitchell'  // Más rápido que lanczos3
            })

            // 2. Escala de grises
            .grayscale()

            // 3. Normalizar (auto-contraste)
            .normalize()

            // 4. Nitidez moderada (reducido de 2.0 a 1.2)
            .sharpen({
                sigma: 1.2,
                m1: 1.0,
                m2: 0.5
            })

            // Removido: linear() y threshold() para mayor velocidad

            .toBuffer();

        console.log('✅ Imagen preprocesada\n');
        return processedBuffer;
    } catch (error) {
        console.warn('⚠️ Error en preprocesamiento, usando imagen original');
        return imageBuffer;
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 ALGORITMO FINAL - MATCHING CON BOUNDING eeBOXES');
    console.log('═══════════════════════════════════════════════════════════\n');

    const imagePath = './WhatsApp Image 2025-11-07 at 7.06.25 PM(2).jpeg';
    const imageBuffer = readFileSync(imagePath);

    console.log('📸 Extrayendo texto con Google Vision...\n');

    // Preprocesar imagen para mejorar calidad (OPTIMIZADO)
    const processedBuffer = await preprocesarImagen(imageBuffer);

    const client = googleVisionClient.getClient();
    const [result] = await client.documentTextDetection({
        image: { content: processedBuffer },
    });

    const fullTextAnnotation = result.fullTextAnnotation;

    if (!fullTextAnnotation?.pages?.[0]) {
        console.log('❌ No se pudo extraer texto');
        return;
    }

    // ═══════════════════════════════════════════════════════════
    // VALIDACIÓN DE CALIDAD
    // ═══════════════════════════════════════════════════════════
    const validacion = validarCalidadOCR(fullTextAnnotation);

    if (!validacion.esValida) {
        console.log('\n❌❌❌ ERROR: CALIDAD DE IMAGEN INSUFICIENTE ❌❌❌\n');
        console.log(`📋 Razón: ${validacion.razon}`);
        if (validacion.confianza !== undefined) {
            console.log(`📊 Confianza del OCR: ${validacion.confianza}%`);
        }
        console.log('\n💡 RECOMENDACIONES PARA MEJORAR LA FOTO:\n');
        console.log('  ✅ Asegúrate de que la boleta esté bien iluminada');
        console.log('  ✅ Mantén la boleta completamente plana (sin arrugas)');
        console.log('  ✅ Toma la foto perpendicular a la boleta (no en ángulo)');
        console.log('  ✅ Asegúrate de que todo el texto esté enfocado');
        console.log('  ✅ Usa el flash si es necesario');
        console.log('  ✅ Evita sombras sobre la boleta\n');
        console.log('Por favor, toma una nueva foto con mejor calidad e intenta nuevamente.\n');
        console.log('═══════════════════════════════════════════════════════════\n');
        return; // Salir sin procesar
    }

    console.log(`✅ Calidad de imagen aceptable`);
    console.log(`   📊 Confianza OCR: ${validacion.confianza || 'N/A'}%`);
    console.log(`   🛒 Productos detectados: ${validacion.numProductos || 'N/A'}\n`);

    // ═══════════════════════════════════════════════════════════
    // PASO 1: Extraer y ordenar bloques por posición
    // ═══════════════════════════════════════════════════════════
    const textBlocks: TextBlock[] = [];
    const page = fullTextAnnotation.pages[0];

    if (page.blocks) {
        for (const block of page.blocks) {
            if (!block.paragraphs) continue;

            for (const paragraph of block.paragraphs) {
                if (!paragraph.words) continue;

                const paragraphText = paragraph.words
                    .map((word: any) =>
                        word.symbols?.map((symbol: any) => symbol.text).join('') || ''
                    )
                    .join(' ');

                if (paragraph.boundingBox?.vertices) {
                    const vertices = paragraph.boundingBox.vertices;
                    const x = vertices.reduce((sum: number, v: any) => sum + (v.x || 0), 0) / vertices.length;
                    const y = vertices.reduce((sum: number, v: any) => sum + (v.y || 0), 0) / vertices.length;

                    if (paragraphText.trim()) {
                        textBlocks.push({ text: paragraphText.trim(), x, y });
                    }
                }
            }
        }
    }

    // Ordenar por posición Y, luego X
    const TOLERANCE_Y = 10;
    textBlocks.sort((a, b) => {
        if (Math.abs(a.y - b.y) < TOLERANCE_Y) {
            return a.x - b.x;
        }
        return a.y - b.y;
    });

    // Agrupar en líneas
    const lineas: string[] = [];
    let lineaActual = '';
    let yActual = textBlocks[0]?.y || 0;

    for (const block of textBlocks) {
        if (Math.abs(block.y - yActual) < TOLERANCE_Y) {
            lineaActual += (lineaActual ? ' ' : '') + block.text;
        } else {
            if (lineaActual) lineas.push(lineaActual);
            lineaActual = block.text;
            yActual = block.y;
        }
    }
    if (lineaActual) lineas.push(lineaActual);

    console.log(`✅ Total de líneas ordenadas: ${lineas.length}\n`);

    // 🔍 DEBUG: Mostrar todas las líneas extraídas
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 DEBUG: TODAS LAS LÍNEAS EXTRAÍDAS');
    console.log('═══════════════════════════════════════════════════════════\n');
    lineas.forEach((linea, idx) => {
        console.log(`[${idx.toString().padStart(2, '0')}] ${linea}`);
    });
    console.log('\n');

    // ═══════════════════════════════════════════════════════════
    // PASO 2: Detectar productos
    // ═══════════════════════════════════════════════════════════
    console.log('🛒 Detectando productos...\n');

    const productos: Producto[] = [];

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];
        const matchCodigo = linea.match(/^(\d{13})\s+(.+)/);

        if (matchCodigo) {
            const codigo = matchCodigo[1];
            let nombre = matchCodigo[2]
                .replace(/\s+\d+[.,]\d{2}$/, '')
                .replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s0-9]/g, ' ')
                .replace(/\s{2,}/g, ' ')
                .trim()
                .substring(0, 40);

            if (nombre.length >= 3) {
                productos.push({
                    lineaIndex: i,
                    codigo,
                    nombre,
                    cantidad: 1,
                    unidad: 'un',
                    precioUnitario: null,
                    precioTotal: null
                });

                console.log(`   ✅ [${i.toString().padStart(2, '0')}] ${nombre}`);
            }
        }
    }

    console.log(`\n✅ Total: ${productos.length} productos\n`);

    // ═══════════════════════════════════════════════════════════
    // PASO 3: Buscar cantidades en líneas cercanas (≤3 líneas)
    // ═══════════════════════════════════════════════════════════
    console.log('📏 Buscando cantidades en líneas cercanas...\n');

    const lineasCantidadUsadas = new Set<number>(); // Evitar que dos productos usen la misma línea

    for (const producto of productos) {
        const lineaProducto = lineas[producto.lineaIndex];

        // Primero intentar extraer de la misma línea del producto
        const matchEnLinea = lineaProducto.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|ko|un)\s+(\d+[.,]\d{2})\s+X\s+/i);

        if (matchEnLinea) {
            producto.cantidad = parseFloat(matchEnLinea[1].replace(',', '.'));
            producto.unidad = (matchEnLinea[2] || 'un').toLowerCase().replace('ko', 'kg');
            producto.precioUnitario = parseFloat(matchEnLinea[3].replace(',', '.'));
            lineasCantidadUsadas.add(producto.lineaIndex);

            console.log(`   ✅ ${producto.nombre}`);
            console.log(`      ${producto.cantidad} ${producto.unidad} @ S/${producto.precioUnitario.toFixed(2)}`);
            continue;
        }

        // Buscar en las siguientes 2 líneas (reducido de 3 a 2 para mayor precisión)
        for (let offset = 1; offset <= 2; offset++) {
            const nextLineIndex = producto.lineaIndex + offset;
            if (nextLineIndex >= lineas.length) break;
            if (lineasCantidadUsadas.has(nextLineIndex)) continue; // Ya usada por otro producto

            const nextLinea = lineas[nextLineIndex];
            const matchCantidad = nextLinea.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|ko|un)?\s+(\d+[.,]\d{2})\s+X\s+/i);

            if (matchCantidad) {
                producto.cantidad = parseFloat(matchCantidad[1].replace(',', '.'));
                producto.unidad = (matchCantidad[2] || 'un').toLowerCase().replace('ko', 'kg');
                producto.precioUnitario = parseFloat(matchCantidad[3].replace(',', '.'));
                lineasCantidadUsadas.add(nextLineIndex);

                console.log(`   ✅ ${producto.nombre}`);
                console.log(`      Línea +${offset}: ${producto.cantidad} ${producto.unidad} @ S/${producto.precioUnitario.toFixed(2)}`);
                break;
            }
        }
    }

    console.log('');

    // ═══════════════════════════════════════════════════════════
    // PASO 4: Extraer bloque de precios (MEJORADO)
    // ═══════════════════════════════════════════════════════════
    console.log('💰 Extrayendo bloque de precios (mejorado)...\n');

    const preciosSueltos: number[] = [];
    const preciosConLinea: Map<number, number> = new Map(); // línea -> precio
    let dentroDeProductos = false;

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];

        if (/^\d{13}/.test(linea)) {
            dentroDeProductos = true;
        }

        if (dentroDeProductos) {
            // Formato 1: Precio suelto en su propia línea (ej: "5.70")
            const matchPrecioSuelto = linea.match(/^(\d+[.,]\d{2})$/);

            // Formato 2: Precio al final de línea de producto (ej: "POP CORN TOT 1KG 7.60")
            const matchPrecioEnProducto = linea.match(/^\d{13}\s+.+\s+(\d+[.,]\d{2})$/);

            // Formato 3: Precio al final de línea de cantidad (ej: "2 2.20 X UN 4.40")
            const matchPrecioEnCantidad = linea.match(/\d+(?:[.,]\d+)?\s+\d+[.,]\d{2}\s+X\s+(?:UN|KG|G|ML|L)\s+(\d+[.,]\d{2})$/i);

            if (matchPrecioSuelto) {
                const precio = parseFloat(matchPrecioSuelto[1].replace(',', '.'));
                if (precio >= 0.10 && precio < 1000) {
                    preciosSueltos.push(precio);
                    preciosConLinea.set(i, precio);
                    console.log(`   [${i}] Precio suelto: ${linea} → S/ ${precio.toFixed(2)}`);
                }
            } else if (matchPrecioEnProducto) {
                const precio = parseFloat(matchPrecioEnProducto[1].replace(',', '.'));
                if (precio >= 0.10 && precio < 1000) {
                    preciosSueltos.push(precio);
                    preciosConLinea.set(i, precio);
                    console.log(`   [${i}] Precio en producto: ${linea} → S/ ${precio.toFixed(2)}`);
                }
            } else if (matchPrecioEnCantidad) {
                const precio = parseFloat(matchPrecioEnCantidad[1].replace(',', '.'));
                if (precio >= 0.10 && precio < 1000) {
                    preciosSueltos.push(precio);
                    preciosConLinea.set(i, precio);
                    console.log(`   [${i}] Precio en cantidad: ${linea} → S/ ${precio.toFixed(2)}`);
                }
            }

            if (linea.includes('Descuento') || linea.includes('TOTAL') || linea.includes('SUB TOTAL')) {
                console.log(`   [${i}] Fin del bloque de productos\n`);
                break;
            }
        }
    }

    console.log(`✅ Total: ${preciosSueltos.length} precios extraídos\n`);

    // ═══════════════════════════════════════════════════════════
    // PASO 5: Asignar precios (MEJORADO - Por proximidad)
    // ═══════════════════════════════════════════════════════════
    console.log('🔗 Asignando precios...\n');

    const preciosUsados = new Array(preciosSueltos.length).fill(false);
    const preciosArray = Array.from(preciosConLinea.entries()); // [lineaIndex, precio]

    // Primero: Asignar precios calculados (cantidad × precio unitario)
    for (const producto of productos) {
        if (producto.precioUnitario) {
            const precioEsperado = producto.cantidad * producto.precioUnitario;

            // Buscar el precio más cercano al esperado
            let mejorMatch = -1;
            let menorDiferencia = Infinity;

            for (let j = 0; j < preciosSueltos.length; j++) {
                if (preciosUsados[j]) continue;

                const diferencia = Math.abs(preciosSueltos[j] - precioEsperado);
                if (diferencia < menorDiferencia && diferencia < 0.05) {
                    menorDiferencia = diferencia;
                    mejorMatch = j;
                }
            }

            if (mejorMatch !== -1) {
                producto.precioTotal = preciosSueltos[mejorMatch];
                preciosUsados[mejorMatch] = true;
                console.log(`   ✅ ${producto.nombre}: S/${preciosSueltos[mejorMatch].toFixed(2)} (calculado)`);
            }
        }
    }

    // Segundo: Asignar precios restantes por proximidad de línea
    for (const producto of productos) {
        if (producto.precioTotal === null) {
            // Buscar el precio más cercano en términos de líneas
            let mejorMatch = -1;
            let menorDistancia = Infinity;

            for (let j = 0; j < preciosArray.length; j++) {
                if (preciosUsados[j]) continue;

                const [lineaPrecio, precio] = preciosArray[j];
                const distancia = Math.abs(lineaPrecio - producto.lineaIndex);

                // Preferir precios que estén DESPUÉS del producto (máximo 5 líneas)
                if (lineaPrecio >= producto.lineaIndex && distancia <= 5 && distancia < menorDistancia) {
                    menorDistancia = distancia;
                    mejorMatch = j;
                }
            }

            if (mejorMatch !== -1) {
                producto.precioTotal = preciosSueltos[mejorMatch];
                preciosUsados[mejorMatch] = true;
                const [lineaPrecio] = preciosArray[mejorMatch];
                console.log(`   📍 ${producto.nombre}: S/${preciosSueltos[mejorMatch].toFixed(2)} (línea ${lineaPrecio}, distancia: ${Math.abs(lineaPrecio - producto.lineaIndex)})`);
            }
        }
    }

    console.log('');

    // ═══════════════════════════════════════════════════════════
    // RESULTADO FINAL
    // ═══════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESULTADO FINAL');
    console.log('═══════════════════════════════════════════════════════════\n');

    productos.forEach((p, i) => {
        console.log(`${i + 1}. ${p.nombre}`);

        if (p.precioUnitario) {
            const calculado = p.cantidad * p.precioUnitario;
            const valido = p.precioTotal && Math.abs(calculado - p.precioTotal) < 0.05;
            const icono = valido ? '✅' : '⚠️';

            console.log(`   Cantidad: ${p.cantidad} ${p.unidad}`);
            console.log(`   Precio unitario: S/ ${p.precioUnitario.toFixed(2)}`);
            console.log(`   Precio total: S/ ${p.precioTotal?.toFixed(2) || 'N/A'}`);
            console.log(`   ${icono} Validación: ${p.cantidad} × ${p.precioUnitario.toFixed(2)} = ${calculado.toFixed(2)}`);
        } else {
            console.log(`   Cantidad: ${p.cantidad} ${p.unidad}`);
            console.log(`   Precio total: S/ ${p.precioTotal?.toFixed(2) || 'N/A'}`);
        }
        console.log('');
    });

    // ═══════════════════════════════════════════════════════════
    // VERIFICACIÓN ESPECÍFICA
    // ═══════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 VERIFICACIÓN SPORADE TROPICA');
    console.log('═══════════════════════════════════════════════════════════\n');

    const sporade = productos.find(p => p.nombre.includes('SPORADE'));

    if (sporade) {
        console.log('Datos esperados:');
        console.log('  Cantidad: 2 un');
        console.log('  Precio unit: S/ 2.20');
        console.log('  Precio total: S/ 4.40\n');

        console.log('Datos obtenidos:');
        console.log(`  Cantidad: ${sporade.cantidad} ${sporade.unidad}`);
        console.log(`  Precio unit: S/ ${sporade.precioUnitario?.toFixed(2) || 'N/A'}`);
        console.log(`  Precio total: S/ ${sporade.precioTotal?.toFixed(2) || 'N/A'}\n`);

        const cantidadOK = sporade.cantidad === 2 && sporade.unidad === 'un';
        const precioUnitOK = sporade.precioUnitario === 2.20;
        const precioTotalOK = sporade.precioTotal === 4.40;

        const cantidadIcono = cantidadOK ? '✅' : '❌';
        const precioUnitIcono = precioUnitOK ? '✅' : '❌';
        const precioTotalIcono = precioTotalOK ? '✅' : '❌';

        console.log(`${cantidadIcono} Cantidad: ${cantidadOK ? 'CORRECTO' : 'INCORRECTO'}`);
        console.log(`${precioUnitIcono} Precio unitario: ${precioUnitOK ? 'CORRECTO' : 'INCORRECTO'}`);
        console.log(`${precioTotalIcono} Precio total: ${precioTotalOK ? 'CORRECTO' : 'INCORRECTO'}`);

        if (cantidadOK && precioUnitOK && precioTotalOK) {
            console.log('\n🎉 ¡SPORADE TROPICA CORRECTAMENTE EXTRAÍDO!');
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
