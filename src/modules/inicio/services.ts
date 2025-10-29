import type { ServiceResponse } from '@/types/service.js';
import { InicioRepository } from './repository.js';
import { NotFoundError } from '@/config/errors/errors.js';
import logger from '@/config/logger.js';
import type { GetInicioParams, InicioResponse, UltimaBoleta } from './schemas.js';

function calcularCo2DeItems(items: Array<{ FactorCo2PorUnidad: any }>): number {
    return items.reduce((sum: number, item) => {
        return sum + (item.FactorCo2PorUnidad ? Number(item.FactorCo2PorUnidad) : 0);
    }, 0);
}

async function getInicioData(params: GetInicioParams): Promise<ServiceResponse<InicioResponse>> {
    const user = await InicioRepository.findUserById(params.userId);
    
    if (!user) {
        throw new NotFoundError('Usuario no encontrado');
    }

    const [boletaData, todasLasBoletas, promociones] = await Promise.all([
        InicioRepository.getUltimaBoleta(params.userId),
        InicioRepository.getAllBoletasWithItems(params.userId),
        InicioRepository.getPromocionesRecientes(),
    ]);

    // Calcular CO2 acumulado de todas las boletas
    const co2Acumulado = todasLasBoletas.reduce((total: number, boleta) => {
        return total + calcularCo2DeItems(boleta.Items);
    }, 0);

    // Transformar la última boleta
    let ultimaBoleta: UltimaBoleta | null = null;
    if (boletaData) {
        const co2Total = calcularCo2DeItems(boletaData.Items);
        
        ultimaBoleta = {
            nombreTienda: boletaData.Tienda?.Nombre ?? boletaData.NombreTienda ?? null,
            categoriaTienda: boletaData.Tienda?.Categoria ?? null,
            logoTienda: boletaData.Tienda?.UrlLogo ?? null,
            co2Total,
            fechaBoleta: boletaData.FechaBoleta,
            precioTotal: boletaData.Total ? Number(boletaData.Total) : null,
        };
    }

    return {
        message: 'Datos de inicio obtenidos exitosamente',
        data: {
            puntosVerdes: user.PuntosVerdes,
            co2Acumulado,
            ultimaBoleta,
            promociones,
        },
    };
}

export const InicioService = {
    getInicioData,
};