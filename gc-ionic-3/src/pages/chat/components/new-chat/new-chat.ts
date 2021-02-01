import { Component, ViewChild, NgZone } from '@angular/core';
import { NavParams, NavController, AlertController, LoadingController, Content, Events } from 'ionic-angular';
import { FormControl } from '@angular/forms';

// Proveedores
import { UtilProvider } from '../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { MesiboProvider } from '../../../../shared/providers/mesibo/mesibo';

import { MesiboCordova } from '../../../../shared/custom-plugins/mesibo.plugin';

import { GroupSetupComponent } from '../group-setup/group-setup';

// Configuración
import { chatConfig } from '../../chat.config';
import { globalConfig } from '../../../../config';

import { find, isArray, includes, remove, map } from 'lodash';
import { User } from '../../interfaces/user';
import { Room } from '../../interfaces/room';
import { ISession } from '../../../../shared/interfaces/session.interface';

@Component({
	selector: 'new-chat',
	templateUrl: 'new-chat.html'
})

export class NewChatComponent {

	@ViewChild(Content) content: Content;

	private contactSearchControl = new FormControl();
	private contacts: User[] = new Array<User>();
	private isGroup: boolean = false;
	private members: User[] = new Array<User>(); // Miembros del chat a crear
	private rooms: Room[] = new Array<Room>();
	private room: Room = null; // Si viene un room por parámetro, este componente servirá para agregar usuario a este room (SOLO PARA GRUPOS)
	private session: ISession = SessionProvider.state.value;
	private online: boolean = false;
	private requesting: boolean = false;
	private searchTerm: string = '';

	constructor(
		private navParams: NavParams,
		private navCtrl: NavController,
		private alertController: AlertController,
		private zone: NgZone,
		private events: Events,
		private loading: LoadingController,
		private request: RequestProvider,
		private util: UtilProvider,
		private sessionProvider: SessionProvider,
		private mesiboCordova: MesiboCordova,
		private mesiboProvider: MesiboProvider
	) { }

	async ionViewDidLoad() {
		this.online = this.util.isNetworkConnected(globalConfig.isBrowser);
		this.rooms = this.navParams.data.rooms;
		this.room = this.navParams.data.room;

		// Solicitamos a la API la lista de contactos
		this.requesting = true;
		const contacts = await this.getContacts();

		this.contacts = (
			(this.room && this.room.id) ? contacts.filter((contact: User) => {
				return !(find(this.room.users, { id: contact.id }));
			}) : contacts
		);
		this.requesting = false;

		// Nos suscribimos al filtro de contactos
		this.searchContactSubscriber();

		// Escuchamos cuando vuelve la conexión a internet
		this.events.subscribe('network-connected', () => {
			this.online = true;
		});

		// Escuchamos cuando perdemos la conexión a internet
		this.events.subscribe('network-disconnected', () => {
			this.online = false;
		});
		this.content.resize();
	}

	// Método del ciclo de vida de la vista, se ejecuta cuando la vista se destruye
	ionViewWillUnload() {
		// Dejamos de escuchar los cambios de red
		this.events.unsubscribe('network-connected');
		this.events.unsubscribe('network-disconnected');
	}

	// Observa el campo de búsqueda y filtra los contactos
	searchContactSubscriber() {
		this.contactSearchControl.valueChanges
			.debounceTime(300) // Cuando se deja de tipear por 300 ms
			.distinctUntilChanged() // Si el input es distinto
			.subscribe(async (searchTerm: any) => {
				this.searchTerm = searchTerm;
			});
	}

	// Solicita a la API, la lista de contactos
	async getContacts(): Promise<User[]> {
		return await this.request
			.get(chatConfig.endpoints.newApi.get.contacts, true)
			.then((response: any) => (isArray(response.data) ? response.data.map(r => (User.responseToObject(r))) : []))
			.catch(e => []);
	}

	onContactClicked(contact: User) {

		if (this.isGroup || this.room) {
			contact.checked = !contact.checked;

			if (contact.checked) {
				// Verificamos que no exista en el arreglo del nuevo grupo (caso borde, no debería ocurrir)
				if (!includes(this.members, { id: contact.id })) {
					this.members.push(contact);
				}
				return;
			}
			// Si el contacto fue deseleccionado, lo eliminamos del nuevo grupo
			remove(this.members, { id: contact.id });
			return;
		}

		// Si no se quiere crear un grupo, creamos un chat con el contacto seleccionado
		this.createOneToOneChat(contact);
	}

	// Crea un chat 1 a 1
	createOneToOneChat(contact: User) {
		// Buscamos una sala que no sea grupo y que la id del usuario concuerde con la de la sala
		const roomToCreate: Room = find(this.rooms, (room: Room) => {
			return (!room.isGroup && find(room.users, (user: User) => {
				return (!user.isMyUser && user.id === contact.id);
			}));
		});

		// Si encontramos la sala, quiere decir que ya existe
		if (roomToCreate) {
			this.mesiboProvider.sendActivity(5, roomToCreate.peer, roomToCreate.groupId, this.room.id, this.session.userId.toString());
			// Llamamos el evento sin crear la conversación (porque ya la tenemos) y paramos la ejecución del método
			this.events.publish('chat-created', roomToCreate.id);
			return;
		}

		// Si la sala no existe, la creamos
		let body: any = {
			nombre: null,
			imagen: null,
			usuarios: [contact.id],
			grupo: false
		};

		let loading = this.loading.create({ content: 'Creando conversación.' });
		loading.present();
		this.request
			.post(chatConfig.endpoints.newApi.post.createChat, body, true)
			.then((response: any) => {
				loading.dismiss();
				if (response.data && response.data.conversacion_id) {
					let peer = find(response.data.usuarios, (usr) => {
						return usr.toString() !== this.session.userId.toString();
					});
					if (peer) {
						this.mesiboProvider.sendActivity(5, peer.toString(), response.data.mesibo_id, response.data.conversacion_id, this.session.userId.toString());
					}
					this.navCtrl.popToRoot();
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

	// Actualiza la lista de contactos
	async updateContacts(refresher: any) {
		// Limpiamos el campo de búsqueda
		this.contactSearchControl.setValue('');
		// Solicitamos a la API la lista de contactos
		const contacts = await this.getContacts();

		this.contacts = (
			(this.room && this.room.id) ? contacts.filter((contact: User) => {
				return !(find(this.room.users, { id: contact.id }));
			}) : contacts
		);
		// Detenemos el indicador de carga del refresher
		refresher.complete();

	}

	// Navega hasta la vista para asignar un nombre al grupo 
	navigateToGroupSetup() {
		this.navCtrl.push(GroupSetupComponent, { members: this.members, session: this.session });
	}

	// Alterna el estado de la variable que indica si se crea un grupo o un chat 1 a 1
	toggleIsGroup() {
		this.zone.run(() => {
			this.isGroup = !this.isGroup;
		});
	}

	// Agrega usuarios a un grupo
	async addMembersToGroup() {
		if (!this.members.length) return;

		const body: any = {
			mesibo_id: this.room.groupId,
			usuarios: map(this.members, 'id'),
			conversacion_id: this.room.id
		};

		const loading = this.loading.create({ content: 'Agregando usuarios.' });
		loading.present();

		await this.request
			.post(chatConfig.endpoints.newApi.post.createChat, body, true)
			.then((response: any) => {
				if (response.data && response.data.conversacion_id) {
					this.mesiboProvider.sendActivity(6, '', this.room.groupId, response.data.conversacion_id, this.session.userId.toString());
					this.util.showToast('Usuarios agregados correctamente.', 3000);
					this.sendGroupNotification(body.usuarios);
					this.navCtrl.pop();
					this.events.publish('update-chats', { roomId: (this.room ? this.room.id : null) });
					return;
				}
				this.util.showToast('No ha sido posible agregar a los usuarios, intente nuevamente.', 3000);
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				this.util.showToast('No ha sido posible agregar a los usuarios, intente nuevamente.', 3000);
			});
		loading.dismiss();
	}

	// Solicita al servicio enviar una notificación push a los usuarios que han sido agregados a un grupo
	async sendGroupNotification(users: any) {
		let body: any = {
			titulo: 'Nuevo grupo',
			conversacionId: this.room.id,
			usuarios: users,
			mensaje: `Nuevo grupo @ ${this.room.name}`
		};
		await this.request
			.post(chatConfig.endpoints.newApi.post.notification, body, true)
			.then((response: any) => { })
			.catch((error: any) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
	}

	// Solicita al servicio enviar una invitación a usar el chat (vía email)
	inviteContact(contact: User) {
		if (!contact.id) return;

		const alert = this.alertController.create({
			title: 'Usuario no disponible',
			subTitle: `¿Deseas enviar una invitación para chatear a ${contact.name}?`,
			buttons: [{
				text: 'Cancelar',
				handler: () => { }
			}, {
				text: 'Enviar',
				handler: async () => {
					let params: any = `?usuarioId=${contact.id}`;
					let loading = this.loading.create({ content: 'Enviando invitación.' });
					loading.present();
					await this.request
						.get(chatConfig.endpoints.newApi.post.invite + params, true)
						.then((response: any) => {
							if (response && response.message) {
								this.util.showToast(response.message, 3000);
								return;
							}
							this.util.showToast('No ha sido posible enviar la invitación, intente nuevamente.', 3000);
						})
						.catch((error: any) => {
							try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
							this.util.showToast('No ha sido posible enviar la invitación, intente nuevamente.', 3000);
						});
					loading.dismiss();
				}
			}]
		});
		alert.present();
	}

}