import { DeepSeekClientService } from '@/lib/clients/deepseek.js';
import { getCategoriasDisponibles } from '../utils/categoryMapper.js';
import logger from '@/config/logger.js';

interface CategoriaInferida {
    categoria: string;
    confianza: number;
    razonamiento: string;
}

/**
 * Infiere la categoría de un producto usando IA
 */
async function inferirCategoria(
    nombreProducto: string,
    supermercado: string
): Promise<CategoriaInferida> {
    try {
        const categoriasDisponibles = getCategoriasDisponibles(supermercado);

        if (categoriasDisponibles.length === 0) {
            logger.warn('⚠️ No hay categorías disponibles para supermercado', { supermercado });
            return {
                categoria: 'Sin categoría',
                confianza: 0.0,
                razonamiento: 'Supermercado sin categorías configuradas',
            };
        }

        const prompt = `Eres un experto en clasificación de productos de supermercados peruanos.

Producto: "${nombreProducto}"
Supermercado: "${supermercado}"

Categorías disponibles en este supermercado:
${categoriasDisponibles.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Instrucciones:
1. Analiza el nombre del producto
2. Elige la categoría MÁS ESPECÍFICA de la lista
3. Si no estás seguro, elige la categoría más genérica posible
4. NO inventes categorías fuera de la lista

Responde en formato JSON:
{
  "categoria": "nombre exacto de la categoría (de la lista)",
  "confianza": número entre 0 y 1,
  "razonamiento": "breve explicación (máx 20 palabras)"
}

Ejemplos:
- "MANZANA ROJA" → {"categoria": "Frutas y Verduras", "confianza": 0.95, "razonamiento": "Es una fruta fresca"}
- "POP CORN" → {"categoria": "Dulces y Snacks", "confianza": 0.90, "razonamiento": "Es un snack empaquetado"}
- "ACEITE VEGETAL" → {"categoria": "Despensa", "confianza": 0.85, "razonamiento": "Es un producto de abarrotes"}`;

        const respuesta = await DeepSeekClientService.chat(prompt, 0.2);
        const resultado = JSON.parse(respuesta) as CategoriaInferida;

        // Validar que la categoría existe
        if (!categoriasDisponibles.includes(resultado.categoria)) {
            logger.warn('⚠️ IA devolvió categoría inválida', {
                producto: nombreProducto,
                categoriaInferida: resultado.categoria,
                categoriasValidas: categoriasDisponibles,
            });
            return {
                categoria: 'Sin categoría',
                confianza: 0.3,
                razonamiento: 'Categoría inferida no encontrada en lista',
            };
        }

        logger.info('✅ Categoría inferida con IA', {
            producto: nombreProducto,
            categoria: resultado.categoria,
            confianza: resultado.confianza,
        });

        return resultado;
    } catch (error) {
        logger.error('❌ Error infiriendo categoría', { nombreProducto, supermercado, error });
        return {
            categoria: 'Sin categoría',
            confianza: 0.0,
            razonamiento: 'Error al procesar con IA',
        };
    }
}

export const CategoryInferenceService = {
    inferirCategoria,
};