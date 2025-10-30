import type { ServiceResponse } from '@/types/service.js';
import { HistorialRepository } from './repository.js';
import { NotFoundError } from '@/config/errors/errors.js';
import logger from '@/config/logger.js';
import { calcularCo2DeItems } from '@/utils/boletas.js';
import type { 
    GetHistorialParams, 
    HistorialResponse, 
    ResumenActividad, 
    CompraReciente,
    BoletaConDetalles 
} from './schemas.js';

function calcularResumenActividad(boletas: BoletaConDetalles[]): ResumenActividad {
    const cantidadBoletas = boletas.length;
    
    // Contar boletas por tipo ambiental
    const cantidadBoletasVerdes = boletas.filter(b => b.TipoAmbiental === 'VERDE').length;
    const cantidadBoletasAmarillas = boletas.filter(b => b.TipoAmbiental === 'AMARILLO').length;
    const cantidadBoletasRojas = boletas.filter(b => b.TipoAmbiental === 'ROJO').length;
    
    // Calcular CO2 total usando la función compartida
    const co2Total = boletas.reduce((total: number, boleta) => {
        return total + calcularCo2DeItems(boleta.Items);
    }, 0);
    
    // Calcular CO2 promedio
    const co2Promedio = cantidadBoletas > 0 ? co2Total / cantidadBoletas : 0;
    
    return {
        cantidadBoletas,
        cantidadBoletasVerdes,
        cantidadBoletasAmarillas,
        cantidadBoletasRojas,
        co2Total,
        co2Promedio,
    };
}

function transformarComprasRecientes(boletas: BoletaConDetalles[]): CompraReciente[] {
    return boletas.map((boleta) => {
        const co2Boleta = calcularCo2DeItems(boleta.Items);
        
        return {
            fechaBoleta: boleta.FechaBoleta,
            logoTienda: boleta.Tienda?.UrlLogo ?? null,
            nombreTienda: boleta.Tienda?.Nombre ?? boleta.NombreTienda ?? null,
            tipoBoleta: boleta.TipoAmbiental,
            co2Boleta,
            cantidadProductos: boleta._count.Items,
        };
    });
}

async function getHistorialData(params: GetHistorialParams): Promise<ServiceResponse<HistorialResponse>> {
    const user = await HistorialRepository.findUserById(params.userId);
    
    if (!user) {
        throw new NotFoundError('Usuario no encontrado');
    }

    const boletas = await HistorialRepository.getAllBoletasConDetalles(params.userId);
    
    const resumenActividad = calcularResumenActividad(boletas);
    const comprasRecientes = transformarComprasRecientes(boletas);

    logger.info('Historial obtenido exitosamente', { userId: params.userId });

    return {
        message: 'Historial obtenido exitosamente',
        data: {
            resumenActividad,
            comprasRecientes,
        },
    };
}

export const HistorialService = {
    getHistorialData,
};