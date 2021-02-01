import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Events } from 'ionic-angular';

import { UUID } from 'angular2-uuid';

import { forEach, isArray, find } from 'lodash';

// Proveedores
import { RequestProvider } from '../../../shared/providers/request/request';

import { global } from '../../../shared/config/global';
import { Room } from '../interfaces/room';
import { ISession } from '../../../shared/interfaces/session.interface';
import { Message } from '../interfaces/message';

@Injectable()

export class ChatLocalProvider {

	constructor(private storage: Storage,
		private events: Events,
		private request: RequestProvider
	) { }

	saveMessagesInQueue(newMessages: Message[]) {
		return new Promise(async (resolve, reject) => {
			const messages: Message[] = await this.getQueueMessages();
			newMessages.forEach((m) => {
				if (!find(messages, t => m.id === t.id)) {
					messages.push(m);
				}
			});
			this.storage.set('chat_queue', JSON.stringify(messages))
				.then(() => resolve(messages))
				.catch((e) => reject(e))
		})
	}

	async getQueueMessages(): Promise<Message[]> {
		const messages: Message[] = new Array<Message>();
		await this.storage
			.get('chat_queue')
			.then((result: any) => {
				try {
					const temp = JSON.parse(result);
					if (isArray(temp)) {
						forEach(temp, (t: Message) => {
							messages.push(t);
						});
					};
				} catch (e) { }
			})
			.catch((error: any) => { });
		return messages;
	}

	async getRoomQueueMessages(room: Room) {
		const messages: Message[] = await this.getQueueMessages();
		const response: Message[] = new Array<Message>();

		if (room.isGroup) {
			messages.forEach(m => {
				if (m.groupId === room.groupId) response.push(m);
			});
		} else {
			messages.forEach(m => {
				if (m.peer === room.peer) response.push(m);
			});
		}
		return response;
	}

	// Guarda las salas en el almacenamiento del dispositivo
	saveRooms(rooms: any) {
		return new Promise(async (resolve, reject) => {
			this.storage
				.set('chat_rooms', JSON.stringify(rooms ? rooms : []))
				.then(async () => {
					resolve();
				})
				.catch(() => reject());
		});
	}

	// Retorna el arreglo de salas del usuario actual
	async getRooms(): Promise<Room[]> {
		let rooms: Room[] = new Array<Room>();
		await this.storage
			.get('chat_rooms')
			.then((result: any) => {
				try {
					const temp = JSON.parse(result);
					if (isArray(temp)) {
						forEach(temp, (t) => {
							rooms.push({
								groupId: t.groupId,
								message: t.message,
								name: t.name,
								peer: t.peer,
								isGroup: t.isGroup,
								users: t.users,
								avatar: t.avatar,
								id: t.id,
								typing: t.typing,
								createdAt: t.createdAt
							});
						});
					};
				} catch (e) { }
			})
			.catch((error: any) => { });
		return rooms;
	}
}