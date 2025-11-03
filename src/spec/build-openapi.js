import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Crear equivalente a __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// CONFIGURACIÓN: AGREGA AQUÍ TUS MÓDULOS
// ==========================================
const MODULES = [
  'test',
  'auth',
  'inicio',
  'historial',
  'perfil',
  'promociones'
];

// ==========================================
// CONFIGURACIÓN DE RUTAS
// ==========================================
const BASE_DIR = __dirname;
const BASE_FILE = path.join(BASE_DIR, 'base.json');
const MODULES_DIR = path.join(BASE_DIR, 'modules');
const OUTPUT_FILE = path.join(BASE_DIR, 'openapi.json');

// ==========================================
// FUNCIONES UTILITARIAS
// ==========================================

/**
 * Lee y parsea un archivo JSON
 * @param {string} filePath - Ruta del archivo
 * @returns {object} - Objeto JSON parseado
 */
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error leyendo ${filePath}:`, error.message);
    process.exit(1);
  }
}

/**
 * Escribe un objeto JSON a un archivo
 * @param {string} filePath - Ruta del archivo
 * @param {object} data - Datos a escribir
 */
function writeJsonFile(filePath, data) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonString, 'utf8');
    console.log(`✅ Archivo generado: ${path.relative(process.cwd(), filePath)}`);
  } catch (error) {
    console.error(`❌ Error escribiendo ${filePath}:`, error.message);
    process.exit(1);
  }
}

/**
 * Combina paths de múltiples módulos
 * @param {Array} modules - Array de objetos de módulo
 * @returns {object} - Paths combinados
 */
function combinePaths(modules) {
  const combinedPaths = {};
  
  modules.forEach(module => {
    if (module.paths) {
      Object.assign(combinedPaths, module.paths);
    }
  });
  
  return combinedPaths;
}

/**
 * Combina schemas de múltiples módulos
 * @param {object} baseSchemas - Schemas base
 * @param {Array} modules - Array de objetos de módulo
 * @returns {object} - Schemas combinados
 */
function combineSchemas(baseSchemas, modules) {
  const combinedSchemas = { ...baseSchemas };
  
  modules.forEach(module => {
    if (module.schemas) {
      Object.assign(combinedSchemas, module.schemas);
    }
  });
  
  return combinedSchemas;
}

/**
 * Combina tags de múltiples módulos
 * @param {Array} baseTags - Tags base
 * @param {Array} modules - Array de objetos de módulo
 * @returns {Array} - Tags combinados
 */
function combineTags(baseTags, modules) {
  const allTags = [...baseTags];
  
  modules.forEach(module => {
    if (module.tags && Array.isArray(module.tags)) {
      allTags.push(...module.tags);
    }
  });
  
  // Remover duplicados basados en el nombre
  const uniqueTags = allTags.filter((tag, index, self) => 
    index === self.findIndex(t => t.name === tag.name)
  );
  
  return uniqueTags;
}

/**
 * Valida que un archivo de módulo tenga la estructura correcta
 * @param {object} module - Objeto del módulo
 * @param {string} moduleName - Nombre del módulo
 * @returns {boolean} - True si es válido
 */
function validateModule(module, moduleName) {
  if (!module || typeof module !== 'object') {
    console.warn(`⚠️  Módulo ${moduleName} no es un objeto válido`);
    return false;
  }
  
  if (!module.paths && !module.schemas && !module.tags) {
    console.warn(`⚠️  Módulo ${moduleName} no contiene paths, schemas ni tags`);
    return false;
  }
  
  return true;
}

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================

/**
 * Construye el archivo OpenAPI final
 */
function buildOpenAPI() {
  console.log('\n🚀 Iniciando construcción del OpenAPI...\n');
  
  // 1. Cargar archivo base
  console.log('📄 Cargando archivo base...');
  const baseSpec = readJsonFile(BASE_FILE);
  
  // 2. Cargar módulos
  console.log('📂 Cargando módulos...');
  const modules = [];
  const loadedModules = [];
  
  MODULES.forEach(moduleName => {
    const moduleFile = path.join(MODULES_DIR, `${moduleName}.json`);
    
    if (!fs.existsSync(moduleFile)) {
      console.warn(`⚠️  Archivo no encontrado: ${moduleFile}`);
      return;
    }
    
    const module = readJsonFile(moduleFile);
    
    if (validateModule(module, moduleName)) {
      modules.push(module);
      loadedModules.push(moduleName);
      console.log(`   ✅ ${moduleName}.json`);
    }
  });
  
  if (modules.length === 0) {
    console.error('❌ No se cargaron módulos válidos');
    process.exit(1);
  }
  
  console.log(`\n📊 Módulos cargados: ${loadedModules.length}`);
  console.log(`   📝 ${loadedModules.join(', ')}\n`);
  
  // 3. Combinar especificaciones
  console.log('🔧 Combinando especificaciones...');
  
  const finalSpec = {
    ...baseSpec,
    paths: combinePaths(modules),
    components: {
      ...baseSpec.components,
      schemas: combineSchemas(baseSpec.components.schemas, modules)
    },
    tags: combineTags(baseSpec.tags, modules)
  };
  
  // 4. Estadísticas
  const pathCount = Object.keys(finalSpec.paths).length;
  const schemaCount = Object.keys(finalSpec.components.schemas).length;
  const tagCount = finalSpec.tags.length;
  
  console.log(`   📍 Paths: ${pathCount}`);
  console.log(`   📋 Schemas: ${schemaCount}`);
  console.log(`   🏷️  Tags: ${tagCount}`);
  
  // 5. Escribir archivo final
  console.log('\n💾 Generando archivo final...');
  writeJsonFile(OUTPUT_FILE, finalSpec);
  
  console.log('\n🎉 ¡OpenAPI generado exitosamente!\n');
  console.log(`📄 Archivo: ${path.relative(process.cwd(), OUTPUT_FILE)}`);
  console.log(`📏 Tamaño: ${Math.round(fs.statSync(OUTPUT_FILE).size / 1024)} KB`);
  console.log(`🕒 Fecha: ${new Date().toLocaleString()}\n`);
}

// ==========================================
// VALIDACIONES INICIALES
// ==========================================

// Verificar que existe el directorio de módulos
if (!fs.existsSync(MODULES_DIR)) {
  console.error(`❌ Directorio de módulos no existe: ${MODULES_DIR}`);
  process.exit(1);
}

// Verificar que existe el archivo base
if (!fs.existsSync(BASE_FILE)) {
  console.error(`❌ Archivo base no existe: ${BASE_FILE}`);
  process.exit(1);
}

// ==========================================
// EJECUCIÓN
// ==========================================

// Para ejecutar directamente el archivo
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1] === __filename) {
  buildOpenAPI();
}


// ==========================================
// EXPORTS
// ==========================================

export {
  buildOpenAPI,
  MODULES
};

export default buildOpenAPI;