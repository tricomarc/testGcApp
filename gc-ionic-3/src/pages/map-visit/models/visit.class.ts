import { isArray, cloneDeep } from 'lodash';
import { ChecklistsBranchOfficePage } from '../../checklists/branch-office/checklists-branch-office';

export class Visit {
    id: number;
    branchOffice: { name: string; id: number; };
    checkinDate: string;
    checkoutDate: string;
    duration: number;
    checklists: any[];

    constructor() {
        this.id = null;
        this.branchOffice = null;
        this.checkinDate = null;
        this.checkoutDate = null;
        this.duration = null;
        this.checklists = [];
    }

    public static parse(json: any): Visit {
        const visit: Visit = new Visit();
        try {
            visit.id = json.id;
            visit.branchOffice = { id: json.sucursal.id, name: json.sucursal.nombre };
            visit.checkinDate = json.fecha_checkin;
            visit.checkoutDate = json.fecha_checkout;
            visit.duration = json.duracion;
            visit.checklists = (isArray(json.checklists) ? json.checklists.map((checklist) => {
                const aux = cloneDeep(checklist);
                aux.statusData = ChecklistsBranchOfficePage.getChecklistStatus(aux);
                return aux;
            }): []);
        } catch (e) { }
        return visit;
    }
}