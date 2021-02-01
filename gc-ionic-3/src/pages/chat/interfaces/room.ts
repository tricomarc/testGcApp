import { find, isArray, orderBy, isNumber } from 'lodash';
import * as moment from 'moment';

import { Message } from './message';
import { User } from './user';
import { ITyping } from './typing.interface';

export class Room {
	id: number;
	groupId: number;
	createdAt: number;
	isGroup: boolean;
	typing: ITyping;
	peer: string;
	name: string;
	avatar: string;
	message: Message;
	users: User[];
	muted?: boolean;

	public static responseToObject(response: any): Room {
		const room = new Room();

		room.id = response.conversacion_id;
		room.createdAt = parseInt(moment(response.created).format('x'));
		room.groupId = isNumber(response.mesibo_id) ? response.mesibo_id : 0;
		room.users = (isArray(response.usuarios) ? orderBy(response.usuarios.map(u => User.responseToObject(u)), 'isMyUser', 'desc') : []);
		room.avatar = response.imagen;
		room.name = response.nombre;
		room.isGroup = response.grupo;
		room.typing = {
			value: null
		};
		room.peer = '';

		room.muted = false;

		const selfUser: User = find(room.users, { isMyUser: true });
		if(selfUser) {
			room.muted = selfUser.muted;
		}

		/*
			Si la sala no es grupo, asignamos el nombre, avatar y peer con los valores del otro usuario de la conversación.
		*/
		if (!room.isGroup) {
			let peer = find(response.usuarios, (user: any) => {
				return !user.mi_usuario;
			});

			if (peer) {
				room.name = peer.nombre;
				room.avatar = peer.imagen;
				room.peer = peer.id.toString()
			}
		}
		return room;
	}
};