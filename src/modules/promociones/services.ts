import type { ServiceResponse } from '@/types/service.js';
import { PromocionesRepository } from './repository.js';
import { NotFoundError, ValidationError } from '@/config/errors/errors.js';
import logger from '@/config/logger.js';
import type {
    GetPromocionesQuery,
    GetPromocionesResponse,
    GetPromocionDetalleParams,
    PromocionDetalle,
    CanjearPromocionInput,
    CanjearPromocionResponse,
    PromocionItem,
} from './schemas.js';

async function getPromociones(
    query: GetPromocionesQuery
): Promise<ServiceResponse<GetPromocionesResponse>> {
    let puntosUsuario: number | undefined;

    // Si se proporciona userId, obtener puntos del usuario
    if (query.userId) {
        const user = await PromocionesRepository.findUserById(query.userId);
        
        if (!user) {
            throw new NotFoundError('Usuario no encontrado');
        }
        
        puntosUsuario = user.PuntosVerdes;

        // Obtener solo las promociones del usuario
        const promocionesUsuario = await PromocionesRepository.getPromocionesDelUsuario(query.userId);

        const promociones: PromocionItem[] = promocionesUsuario.map((pu) => ({
            id: pu.Promocion.Id,
            titulo: pu.Promocion.Titulo,
            descripcion: pu.Promocion.Descripcion,
            tipoPromocion: pu.Promocion.TipoPromocion,
            boletasRequeridas: pu.Promocion.BoletasRequeridas,
            validezInicio: pu.Promocion.ValidezInicio,
            validezFin: pu.Promocion.ValidezFin,
            activa: pu.Promocion.Activa,
            tienda: pu.Promocion.Tienda ? {
                nombre: pu.Promocion.Tienda.Nombre,
                urlLogo: pu.Promocion.Tienda.UrlLogo,
            } : null,
        }));

        logger.info('Promociones del usuario obtenidas', { userId: query.userId, cantidad: promociones.length });

        return {
            message: 'Promociones del usuario obtenidas exitosamente',
            data: {
                puntosUsuario,
                promociones,
            },
        };
    }

    // Si no hay userId, obtener todas las promociones activas
    const promocionesActivas = await PromocionesRepository.getAllPromocionesActivas();

    const promociones: PromocionItem[] = promocionesActivas.map((p) => ({
        id: p.Id,
        titulo: p.Titulo,
        descripcion: p.Descripcion,
        tipoPromocion: p.TipoPromocion,
        boletasRequeridas: p.BoletasRequeridas,
        validezInicio: p.ValidezInicio,
        validezFin: p.ValidezFin,
        activa: p.Activa,
        tienda: p.Tienda ? {
            nombre: p.Tienda.Nombre,
            urlLogo: p.Tienda.UrlLogo,
        } : null,
    }));

    logger.info('Promociones activas obtenidas', { cantidad: promociones.length });

    return {
        message: 'Promociones obtenidas exitosamente',
        data: {
            promociones,
        },
    };
}

async function getPromocionDetalle(
    params: GetPromocionDetalleParams
): Promise<ServiceResponse<PromocionDetalle>> {
    const user = await PromocionesRepository.findUserById(params.userId);
    
    if (!user) {
        throw new NotFoundError('Usuario no encontrado');
    }

    const result = await PromocionesRepository.getPromocionDetalle(params.promocionId, params.userId);
    
    if (!result) {
        throw new NotFoundError('Promoción no encontrada');
    }

    const { promocion, promocionUsuario } = result;

    const detalle: PromocionDetalle = {
        id: promocion.Id,
        titulo: promocion.Titulo,
        descripcion: promocion.Descripcion,
        tipoPromocion: promocion.TipoPromocion,
        boletasRequeridas: promocion.BoletasRequeridas,
        validezInicio: promocion.ValidezInicio,
        validezFin: promocion.ValidezFin,
        activa: promocion.Activa,
        tienda: promocion.Tienda ? {
            nombre: promocion.Tienda.Nombre,
            urlLogo: promocion.Tienda.UrlLogo,
        } : null,
        disponible: promocionUsuario !== null,
        fechaUso: promocionUsuario?.FechaUso ?? null,
        detalles: promocionUsuario?.Detalles ?? null,
    };

    logger.info('Detalle de promoción obtenido', { promocionId: params.promocionId, userId: params.userId });

    return {
        message: 'Detalle de promoción obtenido exitosamente',
        data: detalle,
    };
}

async function canjearPromocion(
    input: CanjearPromocionInput
): Promise<ServiceResponse<CanjearPromocionResponse>> {
    const user = await PromocionesRepository.findUserById(input.userId);
    
    if (!user) {
        throw new NotFoundError('Usuario no encontrado');
    }

    const result = await PromocionesRepository.getPromocionDetalle(input.promocionId, input.userId);
    
    if (!result?.promocion) {
        throw new NotFoundError('Promoción no encontrada');
    }

    const { promocion } = result;

    // Validar que la promoción esté activa
    if (!promocion.Activa) {
        throw new ValidationError('La promoción no está activa');
    }

    // Validar que el usuario tenga puntos suficientes
    if (user.PuntosVerdes < promocion.BoletasRequeridas) {
        throw new ValidationError(
            `Puntos insuficientes. Necesitas ${promocion.BoletasRequeridas} puntos y tienes ${user.PuntosVerdes}`
        );
    }

    // Realizar el canje
    const canje = await PromocionesRepository.canjearPromocion(
        input.userId,
        input.promocionId,
        promocion.BoletasRequeridas,
        input.descripcion 
    );

    logger.info('Promoción canjeada exitosamente', {
        userId: input.userId,
        promocionId: input.promocionId,
        puntosDescontados: promocion.BoletasRequeridas,
        puntosRestantes: canje.puntosRestantes,
        descripcion: input.descripcion, 
    });

    return {
        message: 'Promoción canjeada exitosamente',
        data: canje,
    };
}

export const PromocionesService = {
    getPromociones,
    getPromocionDetalle,
    canjearPromocion,
};