
export interface IPeriodo {
    month:        number;
    year:         number;
    visuales:     number;
    subgerencias: ISubgerencia[];
}

interface ISubgerencia {
    id:               number;
    nombre:           string;
    asignaciones:     number;
    implementados:    number;
    no_implementados: number;
    fotos:            IFotos;
}

interface IFotos {
    total:  number;
    mobile: number;
    web:    number;
}


export class PeriodosModel {
    _periodos: Array<IPeriodo> = [];

    constructor(periodos?:Array<IPeriodo>){
        if(periodos && periodos.length){
            periodos.forEach(periodo => {
                this._periodos.push(new PeriodoModel(periodo));
            });
        }

    }
}

class PeriodoModel implements IPeriodo {
    month: number;
    year: number;
    visuales: number;
    subgerencias: any;

    constructor(periodo: IPeriodo){
        this.month            = periodo && periodo.month    || 0;
        this.year             = periodo && periodo.year     || 0;
        this.visuales         = periodo && periodo.visuales || 0;
        this.subgerencias =  periodo.subgerencias ? new SubgerenciasArrayModel(periodo.subgerencias) : [];
    }
}


class SubgerenciaModel implements ISubgerencia {
    id: number;
    nombre: string;
    asignaciones: number;
    implementados: number;
    no_implementados: number;
    fotos: IFotos;

    constructor(subgerencia){
        this.id = subgerencia && subgerencia.id || 0;
        this.nombre = subgerencia && subgerencia.nombre || null;
        this.asignaciones = subgerencia && subgerencia.asignaciones || 0;
        this.implementados = subgerencia && subgerencia.implementados || 0;
        this.no_implementados = subgerencia && subgerencia.no_implementados || 0;
        this.fotos = subgerencia.fotos ? new FotosModel(subgerencia.fotos) : null;
    }
}

class SubgerenciasArrayModel {
    _subgerencias: Array<ISubgerencia> = [];

    constructor(subgerencias:Array<ISubgerencia>){
        if(subgerencias && subgerencias.length){
            subgerencias.forEach(sub => {
                this._subgerencias.push(new SubgerenciaModel(sub));
            });
        }
    }
}


class FotosModel implements IFotos {
    total: number;
    mobile: number;
    web: number;

    constructor(fotos){
        this.total  =  fotos && fotos.total || 0;
        this.mobile =  fotos && fotos.mobile || 0;
        this.web    =  fotos && fotos.web || 0;
    }
}

// PORCENTAJES

export interface IPorcentajes {
    implementacion: number;
    fotos:          IFotosPorc;
}

interface IFotosPorc {
    mobile: number;
    web:    number;
}

export class PorcentajesModel implements IPorcentajes {
    implementacion: number;
    fotos: IFotosPorc;

    constructor(porc?: IPorcentajes){
        this.implementacion = porc && porc.implementacion || 0;
        this.fotos          = porc && porc.fotos ? new FotoPorcModel(porc.fotos) : new FotoPorcModel();
    }

}

class FotoPorcModel implements IFotosPorc{
    mobile: number;
    web: number;

    constructor(foto?: IFotosPorc){
        this.mobile = foto && foto.mobile || 0;    
        this.web    = foto && foto.web    || 0;   
    }

}


// SUBGERENCIAS

interface ISub {
    id: number;
    nombre: string;
    isCheck: boolean
}

class _SubModel implements ISub{
    id: number;
    nombre: string;
    isCheck: boolean;
    constructor(sub: ISub){
        this.id      = sub && sub.id || 0;
        this.nombre  = sub && sub.nombre || 'N/A';
        this.isCheck = sub && sub.isCheck || false;
    }
}

export class SubModel {
    _subgerencia: Array<ISub> = [];

    constructor(subArray: Array<any>){
        subArray.forEach(sub => {
            this._subgerencia.push(new _SubModel(sub));
        });
    }
}