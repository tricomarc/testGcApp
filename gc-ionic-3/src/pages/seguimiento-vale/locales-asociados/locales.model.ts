export interface IPeriodo {
    periodo_id: number;
    periodo: string;
    fecha_inicio: string;
    fecha_termino: string;
}

export class PeriodoModel implements IPeriodo{
    periodo_id: number;
    periodo: string;
    fecha_inicio: string;
    fecha_termino: string;

    constructor(periodo?){
        this.periodo_id    = periodo && periodo.periodo_id    || '';
        this.periodo       = periodo && periodo.periodo       || '';
        this.fecha_inicio  = periodo && periodo.fecha_inicio  || '';
        this.fecha_termino = periodo && periodo.fecha_termino || '';
    }
    
}

interface ILocalesAsociados {
    tienda_id: number;
    codigo_tienda: string;
    direccion: string;
    region: string;
    comuna: string;
    formato: string;
    cadena: string;
    pendientes : number;
    img_tienda: string;
    tipo_propiedad: string;
}

class SimpleLocalesModel implements ILocalesAsociados{
    tienda_id: number;
    codigo_tienda: string;
    direccion: string;
    region: string;
    comuna: string;
    formato: string;
    cadena: string;
    pendientes: number;
    img_tienda: string;
    tipo_propiedad: string;

    constructor(local?){
        this.tienda_id      = local && local.tienda_id      || 0;
        this.codigo_tienda  = local && local.codigo_tienda  || '';
        this.direccion      = local && local.direccion      || '';
        this.region         = local && local.region         || '';
        this.comuna         = local && local.comuna         || '';
        this.formato        = local && local.formato        || '';
        this.cadena         = local && local.cadena         || '';
        this.pendientes     = local && local.pendientes     || 0;
        this.img_tienda     = local && local.img_tienda     || '';
        this.tipo_propiedad = local && local.tipo_propiedad || '';

    }

}

export interface ILocalesArray{
    locales: Array<ILocalesAsociados>;
}

export class LocalesModel implements ILocalesArray{
    locales: ILocalesAsociados[];
    constructor(locales?){
        var _locales = [];
        if(locales && locales.length){
            locales.forEach(element => {
                _locales.push(new SimpleLocalesModel(element));
            });
            this.locales = _locales;
        }
    }
}