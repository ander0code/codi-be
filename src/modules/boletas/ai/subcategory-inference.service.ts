import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { distance } from 'fastest-levenshtein';
import { tablaMaestra } from '../validation/tablaMaestra.js';
import { DeepSeekClientService } from '@/lib/clients/deepseek.js';
import logger from '@/config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class SubcategoryInferenceService {


    private static cargarSubcategorias(): string {
        const subcategoriasPath = join(__dirname, '../../../json/subcategorias.txt');
        return readFileSync(subcategoriasPath, 'utf-8').trim();
    }

    private static encontrarSubcategoriaMasSimilar(
        subcategoriaIA: string
    ): { subcategoria: string; similitud: number } {

        const todasSubcategorias = Object.keys(tablaMaestra.subcategorias);
        let mejorMatch = { subcategoria: '', similitud: 0 };

        const palabrasIA = subcategoriaIA.toLowerCase().split(/\s+/);

        for (const subcat of todasSubcategorias) {
            const subcatLower = subcat.toLowerCase();
            const palabrasEnComun = palabrasIA.filter(palabra =>
                subcatLower.includes(palabra)
            ).length;

            if (palabrasEnComun > 0) {
                const similitud = palabrasEnComun / palabrasIA.length;

                if (similitud > mejorMatch.similitud) {
                    mejorMatch = { subcategoria: subcat, similitud };
                }
            }
        }

        if (mejorMatch.similitud === 0) {
            for (const subcat of todasSubcategorias) {
                const dist = distance(
                    subcategoriaIA.toLowerCase().trim(),
                    subcat.toLowerCase().trim()
                );
                const maxLen = Math.max(subcategoriaIA.length, subcat.length);
                const similitud = 1 - (dist / maxLen);

                if (similitud > mejorMatch.similitud) {
                    mejorMatch = { subcategoria: subcat, similitud };
                }
            }
        }

        logger.debug('🔍 Fuzzy matching completado', {
            subcategoriaIA,
            mejorMatch: mejorMatch.subcategoria,
            similitud: Math.round(mejorMatch.similitud * 100) / 100
        });

        return mejorMatch;
    }

    static async inferirSubcategoria(
        nombreProducto: string
    ): Promise<{
        subcategoria: string;
        huella_categoria: number;
        confianza: number;
    }> {
        try {
            const subcategoriasTexto = this.cargarSubcategorias();

            logger.info('🔍 Infiriendo subcategoría con lista completa', {
                producto: nombreProducto,
                totalSubcategorias: 130
            });

            const prompt = `Producto de supermercado: "${nombreProducto}"

Subcategorías disponibles:
${subcategoriasTexto}

Analiza el producto y elige la subcategoría MÁS APROPIADA de la lista.

IMPORTANTE: Responde SOLO con el nombre EXACTO de la subcategoría (sin explicaciones, sin puntos, sin números).

Ejemplo de respuesta válida: "Jamonadas"`;

            const respuestaIA = await DeepSeekClientService.chat(prompt, 0.1);
            const subcategoriaIA = respuestaIA.trim();

            logger.info('💡 DeepSeek sugirió subcategoría', {
                producto: nombreProducto,
                subcategoriaSugerida: subcategoriaIA
            });

            const match = this.encontrarSubcategoriaMasSimilar(subcategoriaIA);
            if (match.similitud < 0.3) {
                logger.warn('⚠️ Similitud muy baja, usando fallback', {
                    subcategoriaIA,
                    mejorMatch: match.subcategoria,
                    similitud: match.similitud
                });

                const fallbackSubcat = 'Productos Procesados';
                const fallbackDatos = tablaMaestra.subcategorias[fallbackSubcat];

                return {
                    subcategoria: fallbackSubcat,
                    huella_categoria: fallbackDatos?.huella_media_kg_co2_por_kg || 3.0,
                    confianza: 0.3
                };
            }

            const datosSubcat = tablaMaestra.subcategorias[match.subcategoria];

            logger.info('✅ Subcategoría inferida y validada', {
                producto: nombreProducto,
                subcategoriaIA: subcategoriaIA,
                subcategoriaFinal: match.subcategoria,
                similitud: Math.round(match.similitud * 100) / 100,
                huella: datosSubcat.huella_media_kg_co2_por_kg
            });

            return {
                subcategoria: match.subcategoria,
                huella_categoria: datosSubcat.huella_media_kg_co2_por_kg,
                confianza: match.similitud
            };

        } catch (error) {
            logger.error('❌ Error infiriendo subcategoría', {
                producto: nombreProducto,
                error
            });

            const fallbackSubcat = 'Productos Procesados';
            const fallbackDatos = tablaMaestra.subcategorias[fallbackSubcat];

            return {
                subcategoria: fallbackSubcat,
                huella_categoria: fallbackDatos?.huella_media_kg_co2_por_kg || 3.0,
                confianza: 0.3
            };
        }
    }
}
