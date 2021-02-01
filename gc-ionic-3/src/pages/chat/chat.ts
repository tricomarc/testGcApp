import { Component, NgZone } from '@angular/core';
import { IonicPage, NavController, LoadingController, Events, AlertController, Platform, MenuController, NavParams } from 'ionic-angular';
import { FormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { isArray, forEach, find, includes, filter, clone } from 'lodash';

import { RequestProvider } from '../../shared/providers/request/request';
import { UtilProvider } from '../../shared/providers/util/util';
import { SessionProvider } from '../../shared/providers/session/session';
import { MesiboProvider } from '../../shared/providers/mesibo/mesibo';

import { MesiboCordova, IRoomReading } from '../../shared/custom-plugins/mesibo.plugin'; // Plugin de Mesibo para Cordova

import { NewChatComponent } from './components/new-chat/new-chat';
import { RoomComponent } from './components/room/room';
import { CallHistoryComponent } from './components/call-history/call-history';

import { IChat } from './interfaces/chat.interface';

import { chatConfig } from './chat.config'

import { globalConfig } from '../../config';
import { RoomInfoComponent } from './components/room-info/room-info';
import { Room } from './interfaces/room';
import { User } from './interfaces/user';
import { ISession } from '../../shared/interfaces/session.interface';
import { Message } from './interfaces/message';
import { Activity } from './interfaces/activity';
import { PhotoViewerComponent } from '../../components/photo-viewer/photo-viewer';
import { ITyping } from './interfaces/typing.interface';
import { ISchedule } from './interfaces/schedule.interface';
import { interval } from 'rxjs';

@IonicPage()
@Component({
	selector: 'page-chat',
	templateUrl: 'chat.html',
	providers: []
})

export class ChatPage {

	private roomSearchControl = new FormControl();
	private session: ISession = SessionProvider.state.value;
	private searchTerm: string = '';

	private state: BehaviorSubject<IChat> = new BehaviorSubject<IChat>(this.getInitialState());

	private messageListener: any = null;
	private messageStatusListener: any = null;
	private activityListener: any = null;
	private elapsedTimeInterval: any = null;

	private users: User[] = [];
	private otherContacts: User[] = [];

	public static schedule: ISchedule = {
		isModuleActive: true,
		failedRequest: false,
		secondsLeft: 0
	};

	private scheduleInterval: any = null;

	// Constructor
	constructor(private navCtrl: NavController,
		private loading: LoadingController,
		private zone: NgZone,
		private events: Events,
		private alert: AlertController,
		private platform: Platform,
		private menu: MenuController,
		private navParams: NavParams,
		private request: RequestProvider,
		private util: UtilProvider,
		private mesiboCordova: MesiboCordova,
		private mesiboProvider: MesiboProvider) {
	}

	// Método que se inicia al cargar la vista
	async ionViewDidLoad() {
		this.state.value.isConnecting = true;
		await this.util.await(1000);
		this.state.value.os = (this.platform.is('ios') ? 'ios' : 'other');
		this.initialize();
	}

	ionViewWillEnter() {
		this.menu.enable(true, "menu");
	}

	// Método del ciclo de vida de la vista, se ejecuta cuando la vista se destruye
	ionViewWillUnload() {
		// Dejamos de escuchar el evento que se ejecuta al crear una conversación
		this.events.unsubscribe('chat-created');
		// Dejamos de escuchar los cambios de red
		this.events.unsubscribe('network-connected');
		this.events.unsubscribe('network-disconnected');
		this.events.unsubscribe('chat-updated');
		this.events.unsubscribe('open-room-from-notification');
		this.events.unsubscribe('on-room-closed');
		this.events.unsubscribe('update-chats');
		// Detenemos los servicios de Mesibo
		this.stopMesibo();
		// Dejamos de escuchar los eventos de Mesibo
		this.unsubscribeMesiboEvents();
		// Eliminamos el interval que recalcula el tiempo transcurrido de cada mensaje
		try {
			clearInterval(this.elapsedTimeInterval);
			this.scheduleInterval.unsubscribe();
		} catch (e) { }
	}

	// Solicita a la API, la lista de contactos
	async getContacts(): Promise<User[]> {
		return await this.request
			.get(chatConfig.endpoints.newApi.get.contacts, true)
			.then((response: any) => (isArray(response.data) ? response.data.map(r => (User.responseToObject(r))) : []))
			.catch(e => []);
	}

	async initialize() {
		// Obtenemos el access token de Mesibo desde la sesión del usuario
		this.state.value.accessToken = this.session.mesiboToken;
		if (this.state.value.accessToken) {
			// Iniciamos la sesión del usuario en Mesibo
			if (await this.setAccessToken(this.state.value.accessToken)) {
				this.subscribeMesiboEvents();
			}
		}

		this.mesiboCordova.getProfile({
			isGroup: false,
			peer: this.session.userId.toString(),
			groupId: 0
		}).then((profile) => console.log('mi profile', profile))
			.catch((er) => console.log('mi profile error', er));

		this.state.value.isConnecting = false;
		this.state.value.isOnline = this.util.isNetworkConnected(globalConfig.isBrowser);

		// Solicitamos las salas de este usuario
		this.state.value.isRequesting = true;
		this.state.value.rooms = await this.getRooms();
		ChatPage.schedule = await this.getChatSchedule();
		this.state.value.isRequesting = false;

		this.users = await this.getContacts();

		/* if (!ChatPage.schedule.failedRequest) {
			this.scheduleInterval = interval(1000).subscribe(() => {
				ChatPage.schedule.secondsLeft--;
				if (ChatPage.schedule.secondsLeft < 1) {
					ChatPage.schedule.isModuleActive = !ChatPage.schedule.isModuleActive;
					this.events.publish('chat-module-change', { schedule: ChatPage.schedule });
					this.scheduleInterval.unsubscribe();
				}
			});
		} */

		// Una vez que tenemos las salas, buscamos el último mensaje de cada una de ellas
		this.getRoomsLastMessage();

		// Nos suscribimos al filtro de salas
		this.subscribeSearch();

		if (this.navParams.data.roomId) {
			this.openRoomById(this.navParams.data.roomId);
		}

		this.events.subscribe('open-room-from-notification', (params) => {
			if (params.popToRoot) {
				this.navCtrl.popToRoot();
			}
			this.openRoomById(params.roomId);
		});

		// Evento que se ejecuta cada vez que se crea un chat
		this.events.subscribe('chat-created', (id: number) => {
			this.onChatCreated(id);
		});

		// Escuchamos cuando vuelve la conexión a internet
		this.events.subscribe('network-connected', () => {
			this.state.value.isOnline = true;
		});

		// Escuchamos cuando perdemos la conexión a internet
		this.events.subscribe('network-disconnected', () => {
			this.state.value.isOnline = false;
		});

		this.events.subscribe('update-chats', async (data: any) => {
			await this.updateRooms(null);

			if (data.roomId) {
				const params = {
					room: find(this.state.value.rooms, { id: data.roomId }),
					messagesDeleted: data.messagesDeleted
				};
				this.events.publish('chat-updated-room-detail', params);
				this.events.publish('chat-updated-room-info', params);
			}
		});

		this.events.subscribe('on-room-closed', (params: any) => {
			if (params.openFromNotification) {
				this.getRoomsLastMessage();
				return;
			}
			this.getRoomLastMessage(params.room.peer, params.room.groupId);
		});


		// Cada x segundos, reasigna el time del mensaje de cada sala, esto hace que el pipe 'elapsedTime'
		// se active, y recalcule el tiempo transcurrido de dicho mensaje
		this.elapsedTimeInterval = setInterval(() => {
			let view = this.navCtrl.getActive();
			if (!(view.instance instanceof ChatPage)) return;
			forEach(this.state.value.rooms, (room: Room) => {
				if (room.message && room.message.content) {
					room.message.time = clone(room.message.time);
				}
			});
		}, 10000);
	}

	openRoomById(id: number) {
		const room: Room = find(this.state.value.rooms, { id: id });
		if (room) {
			this.navCtrl.push(RoomComponent, { room: room, rooms: this.state.value.rooms, openFromNotification: true, schedule: ChatPage.schedule }, { animate: false });
		}
	}

	// Observa el campo de búsqueda y filtra las salas
	subscribeSearch() {
		this.roomSearchControl.valueChanges
			.debounceTime(300) // Cuando se deja de tipear por 300 ms
			.distinctUntilChanged() // Si el input es distinto
			.subscribe(async (searchTerm: any) => {
				this.searchTerm = searchTerm;

				if (!this.searchTerm) {
					this.otherContacts = [];
					return;
				}

				this.otherContacts = filter(this.users, (u: User) => {
					return includes(u.name.toLowerCase(), searchTerm.toLowerCase()) && !find(this.state.value.rooms, (r: Room) => r.peer === u.id.toString());
				});
			});
	}

	// Navega hasta la vista para crear un nuevo chat
	addChat() {
		this.navCtrl.push(NewChatComponent, { rawRooms: this.state.value.rooms });
	}

	// Solicita al servicio la lista de salas a las que pertenece el usuario actual
	async getRooms(): Promise<Room[]> {
		let rooms: Room[] = new Array<Room>();
		await this.request
			.get(chatConfig.endpoints.newApi.get.rooms, true)
			.then((response: any) => {
				if (response && isArray(response.data)) {
					rooms = filter(response.data.map((rm: any) => Room.responseToObject(rm)), (rm) => rm.groupId || rm.peer);
				}
			})
			.catch((error: any) => {
				this.util.logError(JSON.stringify(error), chatConfig.errors.getRooms, globalConfig.version);
			});
		return rooms;
	}

	// Recorre las salas y obtiene el último mensaje de cada una
	getRoomsLastMessage() {
		forEach(this.state.value.rooms, (room: Room) => {
			this.getRoomLastMessage(room.peer, room.groupId);
		});
	}

	async getRoomLastMessage(peer: string, groupId: number) {
		let body: IRoomReading = {
			address: "",
			messageCount: 1, // Obtenemos sólo 1 mensaje por sala
			groupId: 0,
			enableFifo: false, // Decimos que el último en entrar es el primero en salir (Necesitamos el último mensaje)
			enableReadReceipt: false // No se debe marca como leído!
		};

		(groupId ? (body.groupId = groupId) : (body.address = peer));

		this.mesiboCordova
			.readProfileMessages(body)
			.then((response: any) => { })
			.catch((error: any) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
	}

	// Se ejecuta cada vez que se crea un chat
	async onChatCreated(id: number) {
		// Actualizamos la lista de salas
		await this.updateRooms(null);

		if (id) {
			// Buscamos el chat creado en la lista de salas actualizada
			const createdRoom = find(this.state.value.rooms, (rm: Room) => {
				return id === rm.id;
			});

			// Si la encontramos, abrimos automaticamente esta sala
			if (createdRoom) {
				this.navCtrl.push(RoomComponent, { room: createdRoom, rooms: this.state.value.rooms, openFromNotification: true, schedule: ChatPage.schedule }, { animate: false });
			}
		}
	}

	// Levanta una alerta que pide confirmar si se elimina una sala
	confirmRoomDelete(room: Room) {
		// Buscamos al usuario actual
		let user = find(room.users, (u: User) => {
			return u.isMyUser === true;
		});

		// Buscamos al usuario que creó el chat
		let owner = find(room.users, (u: User) => {
			return u.isOwner === true && !u.deletedAt;
		});

		// Si no encontramos al usuario actual, paramos la ejecución del método (CASO BORDE)
		if (!user || !user.id) return;

		// Si la jerarquía del usuario actual es menor a la del creador del grupo, no puede abandonar la sala
		if (owner && !user.isAdmin && (user.hierarchy < owner.hierarchy)) {
			this.util.showToast('No puedes abandonar esta conversación.', 3000);
			return;
		}

		// Creamos un diálogo para confirmar la eliminación del grupo
		const confirm = this.alert.create({
			title: (room.isGroup ? 'Salir del grupo' : 'Eliminar conversación'),
			subTitle: 'Esta conversación ya no estará disponible. ¿Desea continuar?',
			buttons: [{
				text: 'Cancelar'
			}, {
				text: 'Continuar',
				handler: () => {
					// Cuerpo del request
					let body: any = {
						mesibo_id: room.groupId,
						conversacion_id: room.id,
						usuarios: [user.id],
						delete: 1
					};

					const loading = this.loading.create({ content: 'Eliminando conversación.' });
					loading.present();

					// Enviamos la petición de eliminación
					this.request
						.post(chatConfig.endpoints.newApi.post.createChat, body, true)
						.then(async (response: any) => {
							if (room.isGroup) {
								/* Si la sala es un grupo, debemos notificar al resto de usuarios que este usuario abandonó la sala */
								forEach(filter(room.users, { isMyUser: false }), (usr: User) => {
									this.mesiboProvider.sendActivity(4, usr.id.toString(), room.groupId, room.id, this.session.userId.toString());
								});
							} else {
								this.mesiboProvider.sendActivity(4, room.peer, room.groupId, room.id, this.session.userId.toString());
							}
							loading.dismiss();
							// Si el usuario es eliminado de la conversación, eliminamos los mensajes de la conversación
							if (response && response.data && response.data.conversacion_id) {
								this.mesiboCordova.deleteRoomMessages({ peer: (room.isGroup ? "" : room.peer), groupId: (room.isGroup ? room.groupId : 0) }).then(() => { });
								// Actualizamos la lista de salas
								await this.updateRooms(null);
								return;
							}
							this.util.showToast('No ha sido posible eliminar la conversación, intente nuevamente.', 3000);
						})
						.catch((error: any) => {
							loading.dismiss();
							this.util.showToast('No ha sido posible eliminar la conversación, intente nuevamente.', 3000);
							this.util.logError(JSON.stringify(error), chatConfig.errors.deleteConversation, globalConfig.version);
						});
				}
			}]
		});
		confirm.present();
	}

	// Actualiza la lista de salas
	async updateRooms(refresher: any) {
		// Limpiamos el campo de búsqueda
		this.roomSearchControl.setValue('');

		/* if (!refresher) this.state.value.isRequesting = true; */

		ChatPage.schedule = {
			isModuleActive: false,
			failedRequest: false,
			secondsLeft: 0
		};

		this.state.value.rooms = await this.getRooms();
		ChatPage.schedule = await this.getChatSchedule();
		
		if (refresher) refresher.complete();
		/* else this.state.value.isRequesting = false; */

		this.zone.run(() => {
			this.getRoomsLastMessage();
		});

		this.users = await this.getContacts();
	}

	// Comienza a escuchar los eventos de Mesibo
	subscribeMesiboEvents() {
		// Escucha cuando llega un nuevo mensaje o se lee una conversación desde la db local
		this.messageListener = this.mesiboCordova
			.onMessage()
			.subscribe((response) => {
				if (response && response.id) {
					const message = Message.responseToObject(response);
					this.processMessage(message);
				}
			});

		// Escucha cuando un mensaje cambia de estado
		this.messageStatusListener = this.mesiboCordova
			.onMessageStatus()
			.subscribe((response: any) => {
				this.processMessageStatus(response);
			});

		// Escucha las actividades que se ejecutan
		this.activityListener = this.mesiboCordova
			.onActivity()
			.subscribe(async (response: any) => {
				this.processActivity(response);
			});
	}

	checkIfChatIsAvailable() {
		if (RoomComponent.currentRoomId) {
			const room: Room = find(this.state.value.rooms, {
				id: RoomComponent.currentRoomId
			});
			if (!room) {
				this.util.showAlert('Chat no disponible', 'Ya no formas parte de esta conversación.');
				this.navCtrl.popToRoot();
			}
		}
	}

	setRoomTyping(activity: Activity) {
		const room: Room = find(this.state.value.rooms, (rm: Room) => {
			return (activity.groupId > 0 ? (rm.groupId === activity.groupId) : (rm.peer === activity.peer));
		});
		if (room) {
			const typing: ITyping = { value: activity.value, user: null };
			if (room.isGroup) {
				const user: User = find(room.users, (usr: User) => {
					return usr.id == activity.profile.address;
				});
				if (user) {
					typing.user = user.name;
				}
			}
			this.zone.run(() => room.typing = typing);
		}
	}

	// Elimina las suscripciones a los eventos de Mesibo
	unsubscribeMesiboEvents() {
		try {
			if (this.messageListener) {
				this.messageListener.unsubscribe();
				this.messageListener = null;
			}
			if (this.messageStatusListener) {
				this.messageStatusListener.unsubscribe();
				this.messageStatusListener = null;
			}
			if (this.activityListener) {
				this.activityListener.unsubscribe();
				this.activityListener = null;
			}
		} catch (e) { }
	}

	// Asigna el access token del usuario en Mesibo y retorna si fue exitoso o no
	async setAccessToken(token: string) {
		let success: boolean = false;
		await this.mesiboCordova.setAccessToken({ token: token })
			.then((response: any) => {
				if (
					response.databaseSuccess === true
					&& response.tokenStatus === 0
					&& response.startStatus === 0
				) {
					success = true;
				}
			})
			.catch((error: any) => {
				this.util.logError(JSON.stringify(error), chatConfig.errors.setAccessToken, globalConfig.version);
			});
		return success;
	}

	// Detiene los servicios de Mesibo 
	async stopMesibo() {
		let success: boolean = false;
		await this.mesiboCordova.stopMesibo()
			.then((response: any) => {
				if (response.stopStatus === 0) {
					success = true;
				}
			})
			.catch((error: any) => {
				this.util.logError(JSON.stringify(error), chatConfig.errors.stopMesibo, globalConfig.version);
			});
		return success;
	}

	// Procesa un mensaje entrante
	processMessage(message: Message) {

		let room: Room = null;

		// Buscamos la sala a la cual pertenece el mensaje
		if (message.groupId) {
			room = find(this.state.value.rooms, (rm: Room) => {
				return (rm.groupId === message.groupId && rm.isGroup);
			});
		} else if (message.peer) {
			room = find(this.state.value.rooms, (rm: Room) => {
				return find(rm.users, (user: User) => {
					return (!user.isMyUser && (user.id.toString() === message.peer));
				}) && !rm.isGroup;
			});
		}

		if (room) {
			message.owner = find(room.users, (user: User) => {
				return user.id.toString() === message.sender;
			});

			this.zone.run(() => { room.message = message; });
		}

		this.events.publish('on-message', message);
	}

	async processActivity(response: any) {

		const activity = Activity.responseToObject(response);
		this.events.publish('on-activity', activity);

		// Si la actividad tiene que ver con el typing
		if (activity.value === 1 || activity.value === 2) {
			this.setRoomTyping(activity);
		} else if (activity.value > 2 && activity.value < 8) {
			const instance = this.navCtrl.getActive().instance;
			await this.updateRooms(null);
			/*
				Si el usuario actual fue eliminado de una sala y si se encuentra en una instancia de sala "RoomComponent"
				verificamos que la sala en la que se encuentra aún exista, si no lo sacamos.
			 */
			if (activity.value === 3) {
				this.checkIfChatIsAvailable();
			}
			/*
				 Si un usuario fue eliminado, abandonó, fue agregado, o le cambiaron los privilegios en una sala
				 actualizamos las vistas correspondientes
			 */
			if (
				includes([4, 5, 6, 7], activity.value)
				&& (
					instance instanceof RoomComponent
					|| instance instanceof RoomInfoComponent
					|| instance instanceof PhotoViewerComponent
				)
			) {
				const params = {
					room: find(this.state.value.rooms, { id: RoomComponent.currentRoomId }),
					messagesDeleted: false
				};
				this.events.publish('chat-updated-room-detail', params);
				this.events.publish('chat-updated-room-info', params);
			}
		}
	}

	processMessageStatus(response: any) {
		const view = this.navCtrl.getActive();

		// Cada vez que un mensaje cambia de estado, si estamos en la vista de chats,
		// volvemos a obtener el último mensaje
		if (view.instance instanceof ChatPage) {
			this.getRoomLastMessage(response.peer, response.groupid);
		}
		this.events.publish('on-message-status', response);
	}

	getInitialState(): IChat {
		return {
			accessToken: null,
			connected: false,
			incomingActivity: null,
			incomingMessage: null,
			isConnecting: false,
			isOnline: false,
			isRequesting: false,
			os: null,
			rooms: new Array<Room>()
		};
	}

	async getChatSchedule(): Promise<ISchedule> {
		const schedule: ISchedule = {
			failedRequest: false,
			isModuleActive: false,
			secondsLeft: 0
		};

		await this.request.get(chatConfig.endpoints.newApi.get.schedule, true)
			.then((response: any) => {
				if (response && response.data) {
					schedule.isModuleActive = /* (response.data.fuera_horario === true ? false : true) */ true;
					schedule.secondsLeft = response.data.segundos_restantes;
				}
			})
			.catch((error: any) => {
				schedule.failedRequest = true;
				this.util.logError(JSON.stringify(error), 'schedule', globalConfig.version);
			});

		return schedule;
	}

	showHistoryCall() {
		this.navCtrl.push(CallHistoryComponent);
	}

	createOneToOneChat(contact: User) {

		const body: any = {
			nombre: null,
			imagen: null,
			usuarios: [contact.id],
			grupo: false
		};

		const loading = this.loading.create({ content: 'Creando conversación.' });
		loading.present();
		this.request
			.post(chatConfig.endpoints.newApi.post.createChat, body, true)
			.then((response: any) => {
				loading.dismiss();
				if (response.data && response.data.conversacion_id) {
					const peer = find(response.data.usuarios, (usr) => {
						return usr.toString() !== this.session.userId.toString();
					});
					if (peer) {
						this.mesiboProvider.sendActivity(5, peer.toString(), response.data.mesibo_id, response.data.conversacion_id, this.session.userId.toString());
					}
					this.events.publish('chat-created', response.data.conversacion_id);
					return;
				}
				this.util.showToast('No ha sido posible crear la conversación, intente nuevamente.', 3000);
			})
			.catch((error: any) => {
				loading.dismiss();
				this.util.showToast('No ha sido posible crear la conversación, intente nuevamente.', 3000);
				this.util.logError(JSON.stringify(error), chatConfig.errors.createChat, globalConfig.version);
			});
	}

	get schedule() {
		return ChatPage.schedule;
	}
}


// 15298787-0 17234283-3 15227775-K zonalperu+