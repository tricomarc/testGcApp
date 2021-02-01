export interface ITienda{
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
    fecha_apertura: string;
    tipo_boleta: string;
    numero_cajas: number;
    tipo_horario: string;
    digitos_boleta: number;
}

export interface IBoleta{
    cajas: number;
    boleta_id: number;
    numero: string;
    pos: string;
    fecha: string;
    digito_boletas: number;
}

export interface IPeriodo {
    periodo_id: number;
    periodo: string;
    fecha_inicio: string;
    fecha_termino: string;
    fecha_extendida: string;
    boletas_minimas: number;
    boletas_maximas: number;
    cerrado: boolean
}

export interface IFormBoleta {
    periodoId: string;
    tiendaId : string;
    nBoleta: string;
    nPos   : string;
    fechaBoleta : string;
    cantidadCaja: string;
}

export class SetNullFormBoleta implements IFormBoleta {
    periodoId: string;
    tiendaId: string;
    nBoleta: string;
    nPos: string;
    fechaBoleta: string;
    cantidadCaja: string;
    
    constructor(){
        this.periodoId = ''
        this.tiendaId = ''
        this.nBoleta = ''
        this.nPos = ''
        this.fechaBoleta = ''
        this.cantidadCaja = ''
    }
}

export class TiendaModel implements ITienda{
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
    fecha_apertura: string;
    tipo_boleta: string;
    numero_cajas: number;
    tipo_horario: string;
    digitos_boleta: number

    constructor(tienda?){
        this.tienda_id       = tienda && tienda.tienda_id || 0;    
        this.codigo_tienda   = tienda && tienda.codigo_tienda || '';
        this.direccion       = tienda && tienda.direccion || '';
        this.region          = tienda && tienda.region || '';
        this.comuna          = tienda && tienda.comuna || '';
        this.formato         = tienda && tienda.formato || '';
        this.cadena          = tienda && tienda.cadena || '';
        this.pendientes      = tienda && tienda.pendientes || 0;
        this.img_tienda      = tienda && tienda.img_tienda || '';
        this.tipo_propiedad  = tienda && tienda.tipo_propiedad || '';
        this.fecha_apertura  = tienda && tienda.fecha_apertura || '';
        this.tipo_boleta     = tienda && tienda.tipo_boleta || '';
        this.numero_cajas    = tienda && tienda.numero_cajas || 0;
        this.tipo_horario    = tienda && tienda.tipo_horario || '';
        this.digitos_boleta  = tienda && tienda.digitos_boleta || 30;
    }

}

export class PeriodoModel implements IPeriodo{
    boletas_maximas: number;
    periodo_id: number;
    periodo: string;
    fecha_inicio: string;
    fecha_termino: string;
    fecha_extendida: string;
    boletas_minimas: number;
    cerrado: boolean;

    constructor(periodo?){
        this.periodo_id      = periodo && periodo.periodo_id || 0;
        this.periodo         = periodo && periodo.periodo || '';
        this.fecha_inicio    = periodo && periodo.fecha_inicio || '';
        this.fecha_termino   = periodo && periodo.fecha_termino || '';
        this.fecha_extendida = periodo && periodo.fecha_extendida || '';
        this.boletas_minimas = periodo && periodo.boletas_minimas || 0;
        this.cerrado         = periodo && periodo.cerrado || null;
        this.boletas_maximas = periodo && periodo.boletas_maximas|| 1000;
    }

}


class SimpleBoletaModel implements IBoleta {
    digito_boletas: number;
    cajas : number;
    boleta_id: number; 
    numero: string;
    pos: string;
    fecha: string;

    constructor(boleta?){
        this.cajas      = boleta && boleta.cajas || 0; 
        this.boleta_id  = boleta && boleta.boleta_id || 0; 
        this.numero     = boleta && boleta.numero || '';
        this.pos        = boleta && boleta.pos || '';
        this.fecha      = boleta && boleta.fecha || '';
        this.digito_boletas = boleta && boleta.digito_boletas || 30;
    }

}

export interface ArrayBoleta {
    boletas: Array<IBoleta>;
}

export class BoletaModel implements ArrayBoleta {

    boletas: IBoleta[];
    constructor(arrBoleta?){
        var _boleta = [];
        if(arrBoleta && arrBoleta.length){
            arrBoleta.forEach(element => {
                _boleta.push(new SimpleBoletaModel(element))
            });
            this.boletas = _boleta;
        }


    }
}