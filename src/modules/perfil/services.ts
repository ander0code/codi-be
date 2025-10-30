import type { ServiceResponse } from '@/types/service.js';
import { PerfilRepository } from './repository.js';
import { NotFoundError } from '@/config/errors/errors.js';
import logger from '@/config/logger.js';
import { calcularEstadisticasBoletas } from '@/utils/boletas.js';
import type { 
    GetPerfilParams, 
    PerfilResponse,
    UpdatePerfilInput,
    UpdatePerfilResponse
} from './schemas.js';

async function getPerfilData(params: GetPerfilParams): Promise<ServiceResponse<PerfilResponse>> {
    const user = await PerfilRepository.findUserById(params.userId);
    
    if (!user) {
        throw new NotFoundError('Usuario no encontrado');
    }

    const boletas = await PerfilRepository.getBoletasParaEstadisticas(params.userId);
    
    // Reutilizar la función compartida para calcular estadísticas
    const estadisticasCalculadas = calcularEstadisticasBoletas(boletas);

    logger.info('Perfil obtenido exitosamente', { userId: params.userId });

    return {
        message: 'Perfil obtenido exitosamente',
        data: {
            datosUsuario: {
                nombre: user.Nombre,
                apellido: user.Apellido,
                correo: user.Correo,
            },
            estadisticas: {
                cantidadRecibos: estadisticasCalculadas.cantidadBoletas,
                cantidadRecibosVerdes: estadisticasCalculadas.cantidadBoletasVerdes,
                co2Total: estadisticasCalculadas.co2Total,
                co2Promedio: estadisticasCalculadas.co2Promedio,
            },
        },
    };
}

async function updatePerfilData(
    params: GetPerfilParams, 
    input: UpdatePerfilInput
): Promise<ServiceResponse<UpdatePerfilResponse>> {
    const user = await PerfilRepository.findUserById(params.userId);
    
    if (!user) {
        throw new NotFoundError('Usuario no encontrado');
    }

    const updatedUser = await PerfilRepository.updateUserProfile(params.userId, input);

    logger.info('Perfil actualizado exitosamente', { userId: params.userId });

    return {
        message: 'Perfil actualizado exitosamente',
        data: {
            nombre: updatedUser.Nombre,
            apellido: updatedUser.Apellido,
            actualizadoEn: updatedUser.ActualizadoEn,
        },
    };
}

export const PerfilService = {
    getPerfilData,
    updatePerfilData,
};