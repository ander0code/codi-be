type BoletaParaEstadisticas = {
    TipoAmbiental: any;
    Items: Array<{
        FactorCo2PorUnidad: any;
    }>;
};

export function calcularCo2DeItems(items: Array<{ FactorCo2PorUnidad: any }>): number {
    return items.reduce((sum: number, item) => {
        return sum + (item.FactorCo2PorUnidad ? Number(item.FactorCo2PorUnidad) : 0);
    }, 0);
}

export function calcularEstadisticasBoletas(boletas: BoletaParaEstadisticas[]) {
    const cantidadBoletas = boletas.length;
    const cantidadBoletasVerdes = boletas.filter(b => b.TipoAmbiental === 'VERDE').length;
    
    const co2Total = boletas.reduce((total: number, boleta) => {
        return total + calcularCo2DeItems(boleta.Items);
    }, 0);
    
    const co2Promedio = cantidadBoletas > 0 ? co2Total / cantidadBoletas : 0;
    
    return {
        cantidadBoletas,
        cantidadBoletasVerdes,
        co2Total,
        co2Promedio,
    };
}