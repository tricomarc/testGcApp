interface ICausas {
    id: number,
    nombre: string,
    conTexto: string,
    texto: string,
    isChecked: boolean
}
interface INoImplementar {
    reporteId: number,
    causaUnica: boolean,
    editable: number,
    noImplementar: boolean,
    causas: Array<ICausas>,
    causasTextoId: number[]
}

class CausaUnica implements ICausas{
    id: number;    nombre: string;
    conTexto: string;
    texto: string;
    isChecked: boolean;
    constructor(causa){
        this.id       = causa.id || null;
        this.nombre   = causa.nombre || null;
        this.conTexto = causa.con_texto || 0;
        this.texto    = this.conTexto == '1' ? causa.texto : null;
        this.isChecked= causa.checked;
    }
    
}

export class NoImplementarModel implements INoImplementar{
    reporteId: number;
    causaUnica: boolean;
    editable: number;
    noImplementar: boolean;
    causas: ICausas[];
    causasTextoId: number[];
    constructor(ObjectData?: any){
        this.reporteId  = ObjectData && ObjectData.reporteId  || null;
        this.causaUnica = !ObjectData ? null  : ObjectData.causa_unica;
        this.editable   = !ObjectData ? null  : parseInt(ObjectData.editable);
        this.noImplementar = ObjectData && ObjectData.no_implementar || null;
        var causas = [];
        var conTextoId = [];
        if(ObjectData && ObjectData.causas.length){
            ObjectData.causas.forEach(element => {
                if(element.con_texto == 1){
                    conTextoId.push(element.id);
                }
                causas.push(new CausaUnica(element));
            });
        }
        this.causasTextoId = conTextoId;
        this.causas = causas;
        
    }

}