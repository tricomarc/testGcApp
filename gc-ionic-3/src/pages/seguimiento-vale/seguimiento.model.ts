interface IVale {
    periodo_id          : number;
    periodo             : string;
    fecha_inicio        : string;
    fecha_termino       : string;
    fecha_extendida     : string;
    boletas_minimas     : number;
    boletas_extra       : number;
    tiendas_completadas : number;
    tiendas_pendientes  : number;
    total_boletas       : number;
}

class SimpleValeModel implements IVale{
    total_boletas: number;
    periodo_id: number;
    periodo: string;
    fecha_inicio: string;
    fecha_termino: string;
    fecha_extendida: string;
    boletas_minimas: number;
    boletas_extra: number;
    tiendas_completadas: number;
    tiendas_pendientes: number;

    constructor(vale?){
        this.periodo_id         = vale && vale.periodo_id          || 0;
        this.periodo            = vale && vale.periodo             || '';
        this.fecha_inicio       = vale && vale.fecha_inicio        || '';
        this.fecha_termino      = vale && vale.fecha_termino       || '';
        this.fecha_extendida    = vale && vale.fecha_extendida     || '';
        this.boletas_minimas    = vale && vale.boletas_minimas     || 0;
        this.boletas_extra      = vale && vale.boletas_extra       || 0;
        this.tiendas_completadas= vale && vale.tiendas_completadas || 0;
        this.tiendas_pendientes = vale && vale.tiendas_pendientes  || 0;
        this.total_boletas      = vale && vale.total_boletas       || 0;
    }

}

export interface IValeArray {
    vales: Array<IVale>;
}

export class ValeModel implements IValeArray{
    vales: IVale[];
    constructor(valesObj?){
        var _vales = [];
        if(valesObj && valesObj.length){
            valesObj.forEach(element => {
                _vales.push(new SimpleValeModel(element));
            });
            this.vales = _vales;
        }
    }

}