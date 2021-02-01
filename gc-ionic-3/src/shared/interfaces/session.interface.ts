import { IModule } from './module.interface';
import { ISetting } from './setting.interface';
import { IStore } from './store.interface';
import { IZone } from './zone.interface';
import { Item } from '../models/item.class';


/* 	La app soporta 5 tipos de usuarios: general, zonal, store, admin y salesman,
	dependiendo del tipo o jerarquía de cada usuario.

		(jerarquía > 99) -> { name: 'general', id: 1 }
		(jerarquía >= 98 && <= 99) -> { name: 'zonal', id: 2 }
		((jerarquía < 98 && jerarquía >= 0) || jerarquía === null) -> { name: 'store', id: 3 }
		(jerarquía === -50) -> { name: 'salesman', id: 4 }
		(tipo === 'administrador') -> { name: 'admin', id: 5 }

	Las condiciones son las que usa el sistema, nosotros usaremos userType para almacenar
	esta información y la guardaremos en la sesión (estas condiciones se evaluan cada vez que un usuario
	inicia sesión).
*/

export interface ISession {
    userId: string;
    sessionId: string;
    token: string;
    name: string;
    lastName: string;
    chargeCode: string;
    hierarchy: number;
    userType: {
        name: string;
        id: number,
        mainModule: string
    };
    isChatModule: boolean;
    isIncidentsModule: boolean;
    modules: IModule[];
    passwordRules: string;
    settings: ISetting[];
    stores: IStore[];
    storesToVisit: IStore[];
    type: string;
    mesiboToken: string;
    zoneId: number;
    zones: IZone[];
    email?: string;
    avatar?: string;
    uuid: string;
    terms: Item[];
    dictionary: Object;
};

export const emptySession: ISession = {
    name: null,
    avatar: null,
    uuid: null,
    lastName: null,
    sessionId: null,
    token: null,
    userId: null,
    chargeCode: null,
    type: null,
    zones: null,
    email: null,
    hierarchy: null,
    isChatModule: null,
    isIncidentsModule: null,
    mesiboToken: null,
    modules: null,
    passwordRules: null,
    settings: null,
    stores: null,
    storesToVisit: null,
    zoneId: null,
    userType: {
        id: null,
        name: null,
        mainModule: null
    },
    terms: [],
    dictionary: null
};
