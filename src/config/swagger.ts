import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer el archivo OpenAPI JSON
const openApiSpec = JSON.parse(readFileSync(join(__dirname, '../spec/openapi.json'), 'utf8'));

// Configuración de Swagger JSDoc (opcional, ya que tenemos el JSON)
const options = {
	definition: openApiSpec,
	apis: [], // No necesitamos especificar archivos ya que tenemos el JSON completo
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
