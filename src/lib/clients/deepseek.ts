import OpenAI from 'openai';
import { env } from '@/config/env.js';
import logger from '@/config/logger.js';

class DeepSeekClientService {
    private static instance: OpenAI;

    static getInstance(): OpenAI {
        if (!DeepSeekClientService.instance) {
            DeepSeekClientService.instance = new OpenAI({
                apiKey: env.llm.deepseekApiKey,
                baseURL: 'https://api.deepseek.com/v1',
            });
            logger.info('✅ Cliente DeepSeek inicializado');
        }
        return DeepSeekClientService.instance;
    }

    /**
     * Chat simple con DeepSeek
     */
    static async chat(prompt: string, temperature = 0.3): Promise<string> {
        try {
            const client = this.getInstance();
            const response = await client.chat.completions.create({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                temperature,
            });

            return response.choices[0].message.content || '';
        } catch (error) {
            logger.error('❌ Error en chat con DeepSeek', { error });
            throw new Error('Error al comunicarse con DeepSeek');
        }
    }

    /**
     * Genera sugerencias ecológicas personalizadas con datos de CO2
     */
    static async generateSuggestions(
        productos: Array<{
            nombre: string;
            co2: number;
            nivel?: 'verde' | 'amarillo' | 'rojo';
        }>,
        analisis: {
            co2Total: number;
            tipoAmbiental: 'VERDE' | 'AMARILLO' | 'ROJO';
        }
    ): Promise<string[]> {
        try {
            // ✅ Prompt enriquecido con datos de CO2 y niveles
            const productosDetalle = productos.map(p =>
                `- ${p.nombre} (${p.co2.toFixed(2)} kg CO2, nivel: ${p.nivel || 'desconocido'})`
            ).join('\n');

            const prompt = `
Eres un experto en sostenibilidad y huella de carbono.

Productos comprados:
${productosDetalle}

Resumen de la compra:
- CO2 total: ${analisis.co2Total.toFixed(2)} kg CO2e
- Tipo de boleta: ${analisis.tipoAmbiental}

Genera 3 sugerencias ecológicas ESPECÍFICAS y accionables para reducir la huella de carbono en futuras compras.
Enfócate en los productos con mayor impacto (nivel rojo y amarillo).

Responde en formato JSON array: ["sugerencia1", "sugerencia2", "sugerencia3"]
            `.trim();

            const content = await this.chat(prompt, 0.7);
            return JSON.parse(content);
        } catch (error) {
            logger.error('❌ Error generando sugerencias con DeepSeek', { error });
            return [
                'Prioriza productos locales y de temporada',
                'Reduce el consumo de carnes rojas',
                'Elige productos con menos empaques'
            ];
        }
    }
}

export { DeepSeekClientService };