import { IPoint } from './point.interface';

export class Zonal {
    id: number;
    name: string;
    charge: string;
    points?: IPoint[];

    constructor() {
        this.id = null;
        this.name = null;
        this.points = [];
    }

    public static parse(json: any): Zonal {
        const zonal: Zonal = new Zonal();
        try {
            zonal.id = json.id;
            zonal.name = json.nombre;
            zonal.charge = (json.cargo ? json.cargo.nombre : null);
        } catch (e) { }
        return zonal;
    }
}