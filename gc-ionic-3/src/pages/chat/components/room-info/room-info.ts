import { Component } from '@angular/core';
import { NavParams, NavController, ModalController, ActionSheetController, Events, LoadingController, AlertController } from 'ionic-angular';
import { ImageViewerController } from 'ionic-img-viewer';
import { MesiboCordova } from '../../../../shared/custom-plugins/mesibo.plugin'; // Plugin de Mesibo para Cordova

// Proveedores
import { UtilProvider } from '../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { CameraProvider } from '../../../../shared/providers/camera/camera';
import { MesiboProvider } from '../../../../shared/providers/mesibo/mesibo';

// Configuración
import { chatConfig } from '../../chat.config';
import { globalConfig } from '../../../../config';
import { PhotoViewerComponent } from '../../../../components/photo-viewer/photo-viewer';
import { NewChatComponent } from '../new-chat/new-chat';

import { orderBy, filter, find, remove, forEach } from 'lodash';
import { Room } from '../../interfaces/room';
import { User } from '../../interfaces/user';
import { ISession } from '../../../../shared/interfaces/session.interface';
import { CameraComponent } from '../../../../shared/providers/camera/component/camera';

@Component({
	selector: 'room-info',
	templateUrl: 'room-info.html'
})

export class RoomInfoComponent {

	private room: Room = null;
	private selfUser: User = null;
	private peerUser: User = null;
	private rooms: Room[] = new Array<Room>();
	private session: ISession = SessionProvider.state.value;
	private avatar: string = null;
	private view: string = null;
	constructor(
		private navParams: NavParams,
		private modalController: ModalController,
		private navController: NavController,
		private actionSheetController: ActionSheetController,
		private events: Events,
		private modal: ModalController,
		private loading: LoadingController,
		private alertController: AlertController,
		private imgViewer: ImageViewerController,
		private cameraProvider: CameraProvider,
		private util: UtilProvider,
		private request: RequestProvider,
		private mesiboCordova: MesiboCordova,
		private mesiboProvider: MesiboProvider,
		private sessionProvider: SessionProvider
	) { }

	async ionViewDidLoad() {
		this.room = this.navParams.data.room;
		this.room.users = orderBy(filter(this.room.users, (u: User) => { return !u.deletedAt; }), 'isMyUser', 'desc');
		// Es necesario que al momento de cargar la sala,
		// tengamos la info de la sala y venga el usuario propio
		if (!this.room) {
			this.navController.pop();
			return;
		}
		this.selfUser = find(this.room.users, (user: User) => { return user.isMyUser });
		if(!this.room.isGroup) {
			this.peerUser = find(this.room.users, (user: User) => { return !user.isMyUser });
		}
		if (!this.selfUser) {
			this.navController.pop();
			return;
		}
		this.rooms = this.navParams.data.rooms;

		// Si el chat o room actual fue actualizado desde otra vista, este evento se encarga de actualizarlo acá
		this.events.subscribe('chat-updated-room-info', (data: any) => {
			if (data && data.room && data.room.id && (this.room.id === data.room.id)) {
				this.room.users = orderBy(filter(data.room.users, (u: User) => { return !u.deletedAt; }), 'isMyUser', 'desc');
			}
		});
	}

	ionViewWillUnload() {
		this.events.unsubscribe('chat-updated-room-info');
	}

	// Muestra las opciones al clickear un usuario
	showUserOptions(user: User) {
		if (user.id === this.selfUser.id) return;

		let buttons: any = [{
			text: 'Enviar mensaje',
			handler: async () => {
				this.createOneToOneChat(user);
			}
		}];

		// Si el usuario actual es admin y el usuario seleccionado no lo es, mostramos el botón para eliminar y para hacer admin al usuario clickeado
		if (this.selfUser.isAdmin) {
			if (!user.isAdmin) {
				buttons.push({
					text: 'Hacer administrador',
					handler: () => {
						this.makeUserAdmin(user);
					}
				});
			}
			buttons.push({
				text: 'Eliminar del grupo',
				handler: () => {
					this.showDeleteUserDialog(user);
				}
			});
		}

		const actionSheet = this.actionSheetController.create({
			buttons: buttons
		});
		actionSheet.present();
	}

	// Muestra los botones para tomar/seleccionar un avatar para el grupo
	showAvatarOptions(fromCameraPlugin?: boolean) {
		let options: any = {
			targetHeight: 500,
			targetWidth: 500,
			quality: 70,
			destinationType: 0,
			correctOrientation: true,
			saveToPhotoAlbum: false,
			allowEdit: true,
			sourceType: 1
		};

		// Arreglo con botones
		let buttons: any = [{
			// Abre la cámara
			text: 'Tomar fotografía',
			handler: async () => {
				let photo: any = null;
				if(fromCameraPlugin){
					photo = await this.cameraProvider.getPhoto(options, globalConfig.isBrowser, globalConfig.version);
				}else {
					photo = await this.getImageCamera();
				}
				if (photo) {
					this.updateGroupAvatar(photo);
				}
			}
		}, {
			// Abre la galería
			text: 'Seleccionar fotografía',
			handler: async () => {
				// sourceType = 0 para abrir la galería
				options.sourceType = 0;
				let photo: any = await this.cameraProvider.getPhoto(options, globalConfig.isBrowser, globalConfig.version);
				if (photo) {
					this.updateGroupAvatar(photo);
				}
			}
		}, {
			// Muestra el avatar
			text: 'Ver fotografía',
			handler: () => {
				this.showCurrentAvatar();
			}
		}];

		const actionSheet = this.actionSheetController.create({
			buttons: buttons
		});
		actionSheet.present();
	}


	async getImageCamera(): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                this.view = 'CAMERA';
                const modal = this.modal.create(CameraComponent, null, { cssClass: 'modal-full'});
                modal.present();
                modal.onDidDismiss((data) => {
                    this.view = 'CONTENT';
                    const image = data && data.image || null;
                    return resolve(image);
                });

            } catch (error) {
                return resolve(null);
            }
        })
	}

	// Actualiza el avatar de un grupo
	updateGroupAvatar(photo: any) {
		let body = {
			conversacion_id: this.room.id,
			imagen: photo
		};
		const loading = this.loading.create({ content: 'Actualizando fotografía grupal.' });
		loading.present();
		this.request
			.post(chatConfig.endpoints.newApi.post.updateAvatarOrName, body, true)
			.then((response: any) => {
				loading.dismiss();
				if (response && response.status) {
					this.room.avatar = response.data.imagen;
					this.events.publish('update-chats', { roomId: (this.room ? this.room.id : null) });
					return;
				}
				this.util.showToast('Fotografía no actualizada. Por favor, intente nuevamente.', 3000);
			})
			.catch((error: any) => {
				loading.dismiss();
				this.util.logError(JSON.stringify(error), chatConfig.errors.updateAvatarOrName, globalConfig.version);
				this.util.showToast('Fotografía no actualizada. Por favor, intente nuevamente.', 3000);
			});
	}

	// Muestra el avatar actual del chat
	showCurrentAvatar() {
		const img = new Image();
		img.src = (this.room.avatar ? this.room.avatar : 'assets/img/resources/avatar.png');
		const imageViewer = this.imgViewer.create(img);
		imageViewer.present();
	}

	// Crea un chat 1 a 1
	createOneToOneChat(contact: User) {
		// Buscamos una sala que no sea grupo y que la id del usuario concuerde con la de la sala
		let roomToCreate: Room = find(this.rooms, (room: Room) => {
			return (!room.isGroup && find(room.users, (user: User) => {
				return (!user.isMyUser && user.id === contact.id);
			}));
		});

		// Si encontramos la sala, quiere decir que ya fue creada una sala entre estos dos usuarios
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

		const loading = this.loading.create({ content: 'Creando conversación.' });
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
						this.mesiboProvider.sendActivity(5, peer.toString(), response.data.mesibo_id, this.room.id, this.session.userId.toString());
					}
					this.navController.popToRoot();
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

	// Muestra una alerta de confirmación para eliminar un usuario
	showDeleteUserDialog(user: User) {
		// Si el usuario actual tiene menos jerarquía que el usuario a eliminar, paramos la ejecución del método
		if (this.selfUser.hierarchy < user.hierarchy) {
			this.util.showToast('No puedes eliminar a este usuario.', 3000);
			return;
		}

		const confirm = this.alertController.create({
			title: 'Eliminar usuario',
			subTitle: `El usuario ${user.name} ya no pertenecerá al grupo`,
			buttons: [{
				text: 'Cancelar'
			}, {
				text: 'Eliminar',
				handler: () => {
					this.deleteUserFromGroup(user);
				}
			}]
		});

		confirm.present();
	}

	// Da privilegios de administrador a un usuario
	async makeUserAdmin(user: User) {
		let body = {
			conversacion_id: this.room.id,
			usuario_id: user.id,
			is_admin: 1
		};

		const loading = this.loading.create({ content: 'Asignando administrador.' });
		loading.present();
		await this.request
			.post(chatConfig.endpoints.newApi.post.makeUserAdmin, body, true)
			.then((response: any) => {
				if (response && response.data) {
					this.util.showToast('Administrador asignado exitosamente.', 3000);
					this.events.publish('update-chats', { roomId: (this.room ? this.room.id : null) });
					this.mesiboProvider.sendActivity(7, user.id.toString(), this.room.groupId, this.room.id, this.session.userId.toString());
					this.sendNotificationToAdministrator([user.id]);
					return;
				}
				this.util.showToast('No ha sido posible asignar el administrador, intente nuevamente.', 3000);
			})
			.catch((error: any) => {
				this.util.showToast('No ha sido posible asignar el administrador, intente nuevamente.', 3000);
				this.util.logError(JSON.stringify(error), chatConfig.errors.makeAdmin, globalConfig.version);
			});
		loading.dismiss();
	}

	// Elimina un usuario del grupo actual
	async deleteUserFromGroup(user: User) {

		let body: any = {
			mesibo_id: this.room.groupId,
			usuarios: [user.id],
			delete: 1,
			conversacion_id: this.room.id
		};

		const loading = this.loading.create({ content: 'Eliminando usuario.' });
		loading.present();
		await this.request
			.post(chatConfig.endpoints.newApi.post.createChat, body, true)
			.then((response: any) => {
				if (response && response.data && response.data.conversacion_id) {
					this.mesiboProvider.sendActivity(3, user.id.toString(), this.room.groupId, this.room.id, this.session.userId.toString());
					remove(this.room.users, { id: user.id });
					this.events.publish('update-chats', { roomId: (this.room ? this.room.id : null) });
					return;
				}
				this.util.showToast('No ha sido posible eliminar al usuario, intente nuevamente.', 3000);
			})
			.catch((error: any) => {
				this.util.showToast('No ha sido posible eliminar al usuario, intente nuevamente.', 3000);
				this.util.logError(JSON.stringify(error), chatConfig.errors.deleteUser, globalConfig.version);
			});
		loading.dismiss();
	}

	// Muestra la vista para agregar usuarios a un grupo
	addUsers() {
		this.navController.push(NewChatComponent, { rooms: this.rooms, room: this.room });
	}

	// Elimina todos los mensajes de una conversación
	deleteRoomMessages() {
		const confirm = this.alertController.create({
			title: 'Vaciar chat',
			subTitle: 'Los mensajes de esta conversación serán eliminados.',
			buttons: [{
				text: 'Cancelar'
			}, {
				text: 'Eliminar',
				handler: () => {
					let body = {
						peer: (this.room.isGroup ? "" : this.room.peer),
						groupId: (this.room.isGroup ? this.room.groupId : 0)
					};
					this.mesiboCordova
						.deleteRoomMessages(body)
						.then((response) => {
							if (response.count > -1) {
								this.util.showToast('Mensajes eliminados exitosamente.', 3000);
								this.events.publish('update-chats', { roomId: (this.room ? this.room.id : null), messagesDeleted: true });
								return;
							}
							this.util.showToast('Mensajes no eliminados, intente nuevamente.', 3000);
						})
						.catch((error) => {
							try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
							this.util.showToast('Mensajes no eliminados, intente nuevamente.', 3000);
						});
				}
			}]
		});
		confirm.present();
	}

	// Elimina la sala
	deleteRoom() {

		// Buscamos al usuario actual
		let user: User = find(this.room.users, (u: User) => {
			return u.isMyUser === true;
		});

		// Buscamos al usuario que creó el chat
		let owner: User = find(this.room.users, (u: User) => {
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
		const confirm = this.alertController.create({
			title: (this.room.isGroup ? 'Salir del grupo' : 'Eliminar conversación'),
			subTitle: 'Esta conversación ya no estará disponible. ¿Desea continuar?',
			buttons: [{
				text: 'Cancelar'
			}, {
				text: 'Continuar',
				handler: () => {
					// Cuerpo del request
					let body: any = {
						mesibo_id: this.room.groupId,
						conversacion_id: this.room.id,
						usuarios: [user.id],
						delete: 1
					};

					const loading = this.loading.create({ content: 'Eliminando conversación.' });
					loading.present();

					// Enviamos la petición de eliminación
					this.request
						.post(chatConfig.endpoints.newApi.post.createChat, body, true)
						.then((response: any) => {
							loading.dismiss();
							if (this.room.isGroup) {
								/* Si la sala es un grupo, debemos notificar al resto de usuarios que este usuario abandonó la sala */
								forEach(filter(this.room.users, { isMyUser: false }), (usr: User) => {
									this.mesiboProvider.sendActivity(4, usr.id.toString(), 0, this.room.id, this.session.userId.toString());
								});
							} else {
								this.mesiboProvider.sendActivity(4, this.room.peer, this.room.groupId, this.room.id, this.session.userId.toString());
							}
							// Si el usuario es eliminado de la conversación, eliminamos los mensajes de la conversación
							if (response.data && response.data.conversacion_id) {
								this.mesiboCordova.deleteRoomMessages({ peer: (this.room.isGroup ? "" : this.room.peer), groupId: (this.room.isGroup ? this.room.groupId : 0) }).then(() => { });

								// Llamamos al evento que actualiza las conversaciones en la vista raíz (chats)
								this.events.publish('update-chats', { roomId: (this.room ? this.room.id : null) });
								this.navController.popToRoot();
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

	// Solicita al servicio enviar una notificación push al usuario que ha sido asignado como administrador
	async sendNotificationToAdministrator(users: any) {
		let body: any = {
			titulo: 'Eres administrador!',
			conversacionId: this.room.id,
			usuarios: users,
			mensaje: `Ahora eres administrador del grupo @ ${this.room.name}`
		};
		await this.request
			.post(chatConfig.endpoints.newApi.post.notification, body, true)
			.then((response: any) => { })
			.catch((error: any) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
	}

	toggleMute() {
		const muted: boolean = this.room.muted;
		this.request.post(chatConfig.endpoints.newApi.post.mute, {
			conversacionId: this.room.id
		}, true)
			.then((response: any) => {
				if (response.data && (response.data.muted || response.data.muted === false)) {
					this.room.muted = response.data.muted;
					this.util.showToast(response.data.muted ? 'Notificaciones silenciadas.' : 'Notificaciones activadas.', 3000);
					this.mesiboProvider.sendActivity(6, this.room.peer, this.room.groupId, this.room.id, this.session.userId.toString());
					return;
				}
				this.util.showToast('No ha sido posible silenciar la conversación, intente nuevamente.', 3000);
				this.room.muted = muted;
			})
			.catch((e) => {
				try { this.util.logError(JSON.stringify(e), null, globalConfig.version); } catch (e) { }
				this.util.showToast('No ha sido posible silenciar la conversación, intente nuevamente.', 3000);
				this.room.muted = muted;
			});
	}
}
