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
     * Valida si el CO2 de un producto es coherente
     * ESTE ES EL ÚNICO USO CRÍTICO DE IA
     */
    static async validateCO2(
        nombreProducto: string,
        co2Estimado: number,
        categoria: string
    ): Promise<{ esValido: boolean; razon: string; co2Sugerido?: number }> {
        try {
            const prompt = `
Eres un experto en huella de carbono de productos de supermercado.

Producto: "${nombreProducto}"
Categoría: "${categoria}"
CO2 estimado: ${co2Estimado} kg CO2e

¿Es coherente este valor de CO2? 
Responde en formato JSON:
{
  "esValido": true/false,
  "razon": "explicación breve",
  "co2Sugerido": número (solo si no es válido)
}

Valores de referencia:
- Frutas/verduras: 0.3-2.0 kg CO2e/kg
- Lácteos: 1.0-4.0 kg CO2e/kg
- Carnes: 5.0-27.0 kg CO2e/kg
- Procesados: 2.0-10.0 kg CO2e/kg
            `.trim();
            
            const content = await this.chat(prompt, 0.3);
            return JSON.parse(content);
        } catch (error) {
            logger.error('❌ Error validando CO2 con DeepSeek', { error });
            return { 
                esValido: true, 
                razon: 'Error de validación, se acepta por defecto' 
            };
        }
    }
    
    /**
     * Genera sugerencias ecológicas personalizadas
     */
    static async generateSuggestions(productos: string[]): Promise<string[]> {
        try {
            const prompt = `
Productos comprados: ${productos.join(', ')}

Genera 3 sugerencias ecológicas breves y accionables para reducir la huella de carbono.
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