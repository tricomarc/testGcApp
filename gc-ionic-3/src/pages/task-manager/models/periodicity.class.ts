export class Periodicity {
    id: number;
    name: string;
    help: string;

    constructor() {
        this.id = null;
        this.name = null;
        this.help = null;
    }

    public static parse(json: any): Periodicity {
        const periodicity = new Periodicity();
        try {
            periodicity.id = json.id;
            periodicity.name = json.nombre;
            periodicity.help = json.ayuda;
        } catch (e) { }
        return periodicity;
    }
};