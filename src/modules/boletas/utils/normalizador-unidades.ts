import logger from '@/config/logger.js';

/**
 * Tabla de pesos promedio SOLO para productos empaquetados/envasados
 * que típicamente se venden por UNIDAD y NO traen peso en la boleta.
 * 
 * ⚠️ IMPORTANTE: Esta tabla es el ÚLTIMO RECURSO
 * - La mayoría de productos frescos (frutas, verduras, carnes) SÍ traen peso en la boleta
 * - Solo usar esta tabla cuando el OCR no detecte peso Y el producto sea por unidad
 * 
 * Basada en análisis de 6,556 productos reales de Tottus
 * Generado: 2025-11-22
 */
const PESOS_POR_CATEGORIA: Record<string, number> = {
    // ========================================
    // PRODUCTOS EMPAQUETADOS - SNACKS Y DULCES
    // ========================================
    'Bocaditos y Piqueos': 0.19,        // Bolsas de snacks
    'Caramelos y Chupetes': 0.19,       // Bolsas de caramelos
    'Chocolates': 0.10,                 // Barras/tabletas individuales
    'Confitería y Snacks': 0.18,        // Paquetes variados
    'Frutos Secos': 0.18,               // Bolsas de frutos secos
    'Galletas': 0.30,                   // Paquetes de galletas
    'Galletas y Wafers': 0.20,          // Paquetes individuales
    'Marshmellows y Gomitas': 0.14,     // Bolsas pequeñas
    'Snacks': 0.15,                     // Bolsas de chips, etc.
    'Toffees y Tejas': 0.36,            // Cajas de dulces
    'Tostadas y Bocaditos': 0.20,       // Paquetes de tostadas

    // ========================================
    // BEBIDAS ENVASADAS
    // ========================================
    'Aguas': 0.60,                      // Botella individual (600ml típico)
    'Bebidas': 0.50,                    // Bebidas envasadas genéricas
    'Gaseosas': 0.60,                   // Botella individual (600ml típico)
    'Jugos Naturales': 0.50,            // Envases individuales
    'Jugos y Tés Líquidos': 0.50,       // Botellas/cajas individuales
    'Ready To Drink': 0.40,             // Bebidas listas para tomar

    // ========================================
    // LÁCTEOS EMPAQUETADOS
    // ========================================
    'Helados': 0.50,                    // Potes individuales
    'Leches': 1.00,                     // Caja/botella 1L típica
    'Yogurt': 0.12,                     // Envase individual
    'Quesos': 0.25,                     // Paquete individual

    // ========================================
    // PANADERÍA Y REPOSTERÍA EMPAQUETADA
    // ========================================
    'Baguettes y Artesanales': 0.30,    // Pan individual
    'Croissant Enrollados y Otros': 0.10, // Unidad individual
    'Kekes y Chifones': 0.60,           // Unidad entera
    'Pan de la Casa y Pan de Molde': 0.50, // Bolsa de pan
    'Panadería': 0.40,                  // Pan genérico
    'Tartas y Roscas': 0.40,            // Unidad individual
    'Tortas': 1.00,                     // Torta individual/pequeña

    // ========================================
    // CARNES Y PROTEÍNAS EMPAQUETADAS
    // ========================================
    'Hamburguesas': 0.12,               // Hamburguesa individual
    'Nuggets y Empanizados': 0.40,      // Caja de nuggets
    'Salchichas': 0.35,                 // Paquete de salchichas
    'Salchichas y Hot Dogs': 0.35,      // Paquete

    // ========================================
    // COMIDAS PREPARADAS EMPAQUETADAS
    // ========================================
    'Empanadas y Sandwiches': 0.15,     // Unidad individual
    'Pizzas': 0.40,                     // Pizza individual
    'Tamales y Humitas': 0.14,          // Unidad individual

    // ========================================
    // ABARROTES EMPAQUETADOS
    // ========================================
    'Cereales': 0.40,                   // Caja de cereal
    'Conservas': 0.40,                  // Lata típica
    'Pasta': 0.50,                      // Paquete de pasta
    'Café e Infusiones': 0.20,          // Caja/sobre

    // ========================================
    // CONDIMENTOS Y ESPECIAS EMPAQUETADOS
    // ========================================
    'Condimentos y Especias': 0.02,     // Sobres pequeños
    'Especias': 0.10,                   // Frascos pequeños
    'Levadura y Polvo para Hornear': 0.02, // Sobres

    // ========================================
    // FALLBACK GENÉRICO
    // ========================================
    'Sin categoría': 0.25,              // Peso promedio genérico
};

/**
 * Estima el peso en kilogramos basado en la categoría del producto
 * ⚠️ SOLO para productos empaquetados que se venden por unidad
 * 
 * @param cantidadUnidades - Número de unidades
 * @param categoria - Categoría del producto
 * @returns Peso estimado en kilogramos
 */
export function estimarPesoPorCategoria(
    cantidadUnidades: number,
    categoria: string
): number {
    const pesoUnitario = PESOS_POR_CATEGORIA[categoria] || PESOS_POR_CATEGORIA['Sin categoría'];
    const pesoTotal = cantidadUnidades * pesoUnitario;

    logger.debug('📊 Estimando peso por categoría (producto empaquetado)', {
        categoria,
        cantidadUnidades,
        pesoUnitario,
        pesoTotal,
    });

    return pesoTotal;
}

/**
 * Normaliza cualquier unidad de medida a kilogramos
 * 
 * PRIORIDAD DE NORMALIZACIÓN:
 * 1. Si ya está en kg/g/l/ml → Convertir directamente
 * 2. Si es "unidad" (un) → Estimar SOLO si es producto empaquetado
 * 
 * @param cantidad - Cantidad en la unidad original
 * @param unidad - Unidad de medida (kg, g, l, ml, un)
 * @param categoria - Categoría del producto (para estimar peso si es por unidad)
 * @returns Cantidad normalizada en kilogramos
 */
export function normalizarCantidadAKg(
    cantidad: number,
    unidad: string,
    categoria: string
): number {
    const unidadLower = unidad.toLowerCase().trim();

    // CASO 1: Ya está en kilogramos
    if (unidadLower === 'kg') {
        logger.debug('✅ Cantidad ya en kg', { cantidad });
        return cantidad;
    }

    // CASO 2: Gramos → Kilogramos
    if (unidadLower === 'g') {
        const cantidadKg = cantidad / 1000;
        logger.debug('🔄 Conversión g → kg', {
            original: cantidad,
            unidad: 'g',
            convertido: cantidadKg,
        });
        return cantidadKg;
    }

    // CASO 3: Litros → Kilogramos (densidad ≈ 1.0 para líquidos comunes)
    if (unidadLower === 'l') {
        logger.debug('🔄 Conversión l → kg (densidad ≈ 1.0)', {
            original: cantidad,
            unidad: 'l',
            convertido: cantidad,
        });
        return cantidad; // 1L ≈ 1kg para agua, leche, jugos, etc.
    }

    // CASO 4: Mililitros → Kilogramos
    if (unidadLower === 'ml') {
        const cantidadKg = cantidad / 1000;
        logger.debug('🔄 Conversión ml → kg', {
            original: cantidad,
            unidad: 'ml',
            convertido: cantidadKg,
        });
        return cantidadKg;
    }

    // CASO 5: Unidades → Kilogramos (SOLO para productos empaquetados)
    // ⚠️ Este es el ÚLTIMO RECURSO - la mayoría de productos frescos traen peso
    if (unidadLower === 'un' || unidadLower === 'unidad' || unidadLower === 'unidades') {
        const cantidadKg = estimarPesoPorCategoria(cantidad, categoria);
        logger.debug('🔄 Conversión unidades → kg (producto empaquetado)', {
            original: cantidad,
            unidad: 'un',
            categoria,
            convertido: cantidadKg,
        });
        return cantidadKg;
    }

    // CASO 6: Sin unidad o unidad no reconocida → Usar categoría como último recurso
    logger.warn('⚠️ Unidad no reconocida, estimando por categoría', {
        cantidad,
        unidad,
        categoria,
    });
    return estimarPesoPorCategoria(cantidad, categoria);
}
