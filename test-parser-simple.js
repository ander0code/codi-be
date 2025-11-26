/**
 * Parser REAL v2 - Extrae productos y asocia precios del bloque de precios
 * Estrategia: Los precios totales aparecen en orden después de todos los productos
 */

import vision from '@google-cloud/vision';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const IMAGE_PATH = path.join(__dirname, 'WhatsApp Image 2025-11-07 at 7.06.25 PM(2).jpeg');

if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('❌ Error: No se encontró credentials.json');
    process.exit(1);
}

const client = new vision.ImageAnnotatorClient({
    keyFilename: CREDENTIALS_PATH
});

function parseProductos(text) {
    const lineas = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    console.log(`\n📄 Total líneas: ${lineas.length}\n`);

    // PASO 1: Extraer todos los productos (con código de 13 dígitos)
    const productos = [];

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];
        const matchCodigo = linea.match(/^(\d{13})\s+(.+)/);

        if (matchCodigo) {
            const codigo = matchCodigo[1];
            let nombre = matchCodigo[2]
                .replace(/\s+\d+[.,]\d{2}$/, '')
                .replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s0-9]/g, ' ')
                .replace(/\s{2,}/g, ' ')
                .trim();

            productos.push({
                lineaIndex: i,
                codigo,
                nombre,
                cantidad: null,
                unidad: null,
                precioUnitario: null,
                precioTotal: null
            });
        }
    }

    console.log(`📦 Productos detectados: ${productos.length}\n`);

    // PASO 2: Para cada producto, buscar cantidad/precio unitario en la siguiente línea
    for (const producto of productos) {
        const lineaProducto = producto.lineaIndex;

        if (lineaProducto + 1 < lineas.length) {
            const lineaSig = lineas[lineaProducto + 1];

            // No es otro producto
            if (!/^\d{13}/.test(lineaSig)) {
                // Buscar patrón de cantidad: "1.17kg 6.50 X kg" o "3 2.39 X UN" o "2 2.20 X UN"
                const matchCantidad = lineaSig.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|ko|un)?\s+(\d+[.,]\d{2})\s+X\s+/i);

                if (matchCantidad) {
                    producto.cantidad = parseFloat(matchCantidad[1].replace(',', '.'));
                    producto.unidad = (matchCantidad[2] || 'un').toLowerCase().replace('ko', 'kg');
                    producto.precioUnitario = parseFloat(matchCantidad[3].replace(',', '.'));
                }
            }
        }

        // Si no tiene cantidad, usar 1 unidad
        if (!producto.cantidad) {
            producto.cantidad = 1;
            producto.unidad = 'un';
        }
    }

    // PASO 3: Extraer bloque de precios (líneas que solo tienen números con 2 decimales)
    const preciosSueltos = [];

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];

        // Línea que solo tiene un precio (ej: "7.60", "5.70")
        if (/^\d+[.,]\d{2}$/.test(linea)) {
            const precio = parseFloat(linea.replace(',', '.'));

            // Ignorar precios muy grandes (probablemente son totales, descuentos, etc)
            if (precio < 100) {
                preciosSueltos.push({
                    lineaIndex: i,
                    precio
                });
            }
        }
    }

    console.log(`💰 Precios sueltos encontrados: ${preciosSueltos.length}`);
    if (preciosSueltos.length > 0) {
        console.log(`   ${preciosSueltos.map(p => `S/ ${p.precio.toFixed(2)} (línea ${p.lineaIndex + 1})`).join(', ')}\n`);
    }

    // PASO 4: Asociar precios a productos
    // Los precios aparecen en el mismo orden que los productos
    let indicePrecio = 0;

    for (let i = 0; i < productos.length; i++) {
        const producto = productos[i];

        console.log(`\n${i + 1}. ${producto.nombre}`);
        console.log(`   Código: ${producto.codigo}`);
        console.log(`   Cantidad: ${producto.cantidad} ${producto.unidad}`);

        if (producto.precioUnitario) {
            console.log(`   Precio unitario: S/ ${producto.precioUnitario.toFixed(2)}`);
        }

        // Asignar precio del bloque de precios
        if (indicePrecio < preciosSueltos.length) {
            producto.precioTotal = preciosSueltos[indicePrecio].precio;
            console.log(`   Precio total: S/ ${producto.precioTotal.toFixed(2)} (línea ${preciosSueltos[indicePrecio].lineaIndex + 1})`);
            indicePrecio++;
        } else {
            console.log(`   ⚠️  Sin precio total disponible`);
        }
    }

    // Filtrar solo productos con precio
    return productos.filter(p => p.precioTotal !== null);
}

function extraerTotalBoleta(text) {
    // Buscar "TOTAL:" seguido de "S/ XX.XX"
    const match = text.match(/TOTAL:\s*\n\s*S\/\s*(\d+[.,]\d{2})/i);
    if (match) {
        return parseFloat(match[1].replace(',', '.'));
    }

    // Buscar "IMPORTE TOTAL:" seguido del monto
    const match2 = text.match(/IMPORTE TOTAL:\s*\n\s*(\d+[.,]\d{2})/i);
    if (match2) {
        return parseFloat(match2[1].replace(',', '.'));
    }

    return null;
}

async function main() {
    console.log('🚀 Extrayendo productos de la boleta (SOLO lectura, SIN cálculos)\n');
    console.log('═'.repeat(80));
    console.log(`📁 Imagen: ${IMAGE_PATH}\n`);

    const imageBuffer = fs.readFileSync(IMAGE_PATH);
    console.log(`✅ Imagen cargada: ${imageBuffer.length} bytes\n`);

    try {
        console.log('📝 Extrayendo texto con Google Cloud Vision...\n');

        const [result] = await client.documentTextDetection({
            image: { content: imageBuffer },
        });

        const fullTextAnnotation = result.fullTextAnnotation;

        if (!fullTextAnnotation || !fullTextAnnotation.text) {
            console.error('❌ No se detectó texto en la imagen');
            process.exit(1);
        }

        const texto = fullTextAnnotation.text;

        console.log('✅ Texto extraído exitosamente');
        console.log(`   Caracteres: ${texto.length}`);
        console.log(`   Líneas: ${texto.split('\n').length}`);
        console.log(`   Confianza: ${Math.round((fullTextAnnotation.pages?.[0]?.confidence || 0) * 100)}%`);

        fs.writeFileSync('texto-extraido.txt', texto);
        console.log('   💾 Texto guardado en: texto-extraido.txt');

        console.log('\n═'.repeat(80));
        console.log('📦 PARSEANDO PRODUCTOS');
        console.log('═'.repeat(80));

        const productos = parseProductos(texto);

        // Extraer total de la boleta
        const totalBoleta = extraerTotalBoleta(texto);

        console.log('\n\n═'.repeat(80));
        console.log('📊 RESUMEN FINAL');
        console.log('═'.repeat(80));
        console.log(`\nTotal productos extraídos: ${productos.length}\n`);

        productos.forEach((p, i) => {
            console.log(`${i + 1}. ${p.nombre}`);
            console.log(`   Código: ${p.codigo}`);
            console.log(`   Cantidad: ${p.cantidad} ${p.unidad}`);
            if (p.precioUnitario) {
                console.log(`   Precio unitario: S/ ${p.precioUnitario.toFixed(2)}`);
            }
            console.log(`   Precio total: S/ ${p.precioTotal.toFixed(2)}`);
            console.log('');
        });

        const totalCalculado = productos.reduce((sum, p) => sum + p.precioTotal, 0);

        console.log('─'.repeat(80));
        if (totalBoleta) {
            console.log(`💰 TOTAL (de la boleta): S/ ${totalBoleta.toFixed(2)}`);
            console.log(`📊 Total de productos: S/ ${totalCalculado.toFixed(2)}`);
            const diferencia = Math.abs(totalBoleta - totalCalculado);
            if (diferencia > 0.01) {
                console.log(`ℹ️  Diferencia: S/ ${diferencia.toFixed(2)} (puede incluir descuentos)`);
            } else {
                console.log(`✅ Totales coinciden perfectamente`);
            }
        } else {
            console.log(`💰 TOTAL: S/ ${totalCalculado.toFixed(2)}`);
        }
        console.log('═'.repeat(80));

        const resultados = {
            fecha: new Date().toISOString(),
            imagen: IMAGE_PATH,
            totalProductos: productos.length,
            totalBoleta: totalBoleta,
            totalProductos: totalCalculado,
            productos: productos.map(p => ({
                codigo: p.codigo,
                nombre: p.nombre,
                cantidad: p.cantidad,
                unidad: p.unidad,
                precioUnitario: p.precioUnitario,
                precioTotal: p.precioTotal
            }))
        };

        fs.writeFileSync('test-parser-results.json', JSON.stringify(resultados, null, 2));
        console.log('\n💾 Resultados guardados en: test-parser-results.json');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
