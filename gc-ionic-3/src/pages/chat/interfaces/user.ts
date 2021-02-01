import * as moment from 'moment';
import  { isNumber, isNaN } from 'lodash';

export class User {
    id: number; 
    deletedAt: number;
    hierarchy: number;
    name: string;
    username: string;
    avatar: string;
    isAdmin: boolean;
    isOwner: boolean;
    isMyUser: boolean;
    charge?: {
        name: string;
    };
    checked?: boolean;
    store?: {
        name: string;
    };
    zone?: {
        name: string;
    };
    registered?: boolean;
    muted?: boolean;
    inRoom?: boolean;

    public static responseToObject(response: any): User {
        const user: User = new User();
        const deletedAt: number = parseInt(moment(response.deleted_at).format('x'));
        user.id = response.id;
        user.deletedAt = (isNaN(deletedAt) ? null : deletedAt);
        user.hierarchy = isNumber(response.jerarquia) ? response.jerarquia : null;
        user.name = (response.nombre_despliegue ? response.nombre_despliegue : response.nombre);
        user.username = response.usuario;
        user.avatar = response.imagen;
        user.isAdmin = response.is_admin;
        user.isOwner = response.creador;
        user.isMyUser = response.mi_usuario;
        user.registered = response.token_mesibo ? true : false;
        user.charge = {
            name: (response.cargo ? response.cargo.nombre : '')
        };
        user.store = {
            name: (response.sucursal && response.sucursal.nombre ? response.sucursal.nombre : null)
        };
        user.zone = {
            name: (response.zona && response.zona.nombre ? response.zona.nombre : null)
        };
        user.muted = (response.muted === true ? true : false);
        return user;
    }
};