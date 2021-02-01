import { Component } from '@angular/core';
import { NavParams, NavController, LoadingController, ActionSheetController, ModalController, Events } from 'ionic-angular';

// Proveedores
import { UtilProvider } from '../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { CameraProvider } from '../../../../shared/providers/camera/camera';
import { MesiboProvider } from '../../../../shared/providers/mesibo/mesibo';
import { PhotoViewerComponent } from '../../../../components/photo-viewer/photo-viewer';

import { map, remove } from 'lodash';

// Configuración
import { chatConfig } from '../../chat.config';
import { globalConfig } from '../../../../config';
import { User } from '../../interfaces/user';
import { ISession } from '../../../../shared/interfaces/session.interface';
import { CameraComponent } from '../../../../shared/providers/camera/component/camera';

@Component({
	selector: 'group-setup',
	templateUrl: 'group-setup.html'
})

export class GroupSetupComponent {

	private form = {
		name: '',
		avatar: ''
	};
	private members: User[] = new Array<User>();
	private session: ISession = null;
	private requesting: boolean = false;
	private view: string = null;
	constructor(
		private navParams: NavParams,
		private navCtrl: NavController,
		private actionSheetController: ActionSheetController,
		private modalController: ModalController,
		private events: Events,
		private loading: LoadingController,
		private request: RequestProvider,
		private modal: ModalController,
		private util: UtilProvider,
		private cameraProvider: CameraProvider,
		private mesiboProvider: MesiboProvider
	) { }

	async ionViewDidLoad() {
		// Verificamos que el grupo no esté vacío (caso borde, no debería ocurrir).
		if (!this.navParams.data.members || !this.navParams.data.members.length) {
			this.util.showToast('No es posible crear un grupo sin integrantes.', 3000);
			this.navCtrl.pop();
			return;
		}
		this.members = this.navParams.data.members;
		this.session = this.navParams.data.session;
	}

	// Eliminamos un contacto del grupo
	removeContact(contact: User) {
		contact.checked = false;
		remove(this.members, { id: contact.id });
		// Si todos los contactos fuero eliminados, cerramos la vista actual
		if (!this.members.length) {
			this.navCtrl.pop();
		}
	}

	// Envía una solicitud a la API para registrar el grupo
	saveGroup() {
		// Validamos que el grupo no esté vacío
		if (!this.members.length) {
			this.util.showToast('Para crear un grupo almenos debe elegir 1 participante.', 3000);
			this.navCtrl.pop();
			return;
		}

		// Validamos que se haya ingresado un nombre para el grupo
		if (!this.form.name) {
			this.util.showToast('Ingrese un nombre para el grupo.', 3000);
			return;
		}

		let body: any = {
			nombre: this.form.name,
			imagen: this.form.avatar,
			usuarios: map(this.members, 'id'),
			grupo: true
		};

		const loading = this.loading.create({ content: 'Registrando grupo.' });
		loading.present();

		this.request
			.post(chatConfig.endpoints.newApi.post.createChat, body, true)
			.then((response: any) => {
				loading.dismiss();
				if (response.data && response.data.conversacion_id) {
					this.mesiboProvider.sendActivity(5, '', response.data.mesibo_id, response.data.conversacion_id, this.session.userId.toString());
					this.sendGroupNotification(body.usuarios, response.data);
					this.navCtrl.popToRoot();
					this.events.publish('chat-created', response.data.conversacion_id);
					return;
				}
				this.util.showToast('Grupo no registrado. Por favor, intente nuevamente.', 3000);
			})
			.catch((error: any) => {
				loading.dismiss();
				this.util.logError(JSON.stringify(error), chatConfig.errors.createGroup, globalConfig.version);
				this.util.showToast('Grupo no registrado. Por favor, intente nuevamente.', 3000);
			});

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
				if(fromCameraPlugin){
					let photo: any = await this.cameraProvider.getPhoto(options, globalConfig.isBrowser, globalConfig.version);
					if (photo) {
						this.form.avatar = photo;
					}
				}else {
					let photo: any = await this.getImageCamera();
					if (photo) {
						this.form.avatar = photo;
					}
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
					this.form.avatar = photo;
				}
			}
		}];

		// Si ya adjuntamos un avatar, agregamos las opciones para ver y descartar el avatar
		if (this.form.avatar) {
			buttons.push({
				// Muestra el avatar
				text: 'Ver fotografía',
				handler: () => {
					let modal = this.modalController.create(PhotoViewerComponent, { photo: { url: this.form.avatar }, type: 'none' });
					modal.present();
				}
			});

			buttons.push({
				// Descarta el avatar actual
				text: 'Descartar fotografía',
				handler: () => {
					this.form.avatar = '';
				}
			});
		}

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

	// Solicita al servicio enviar una notificación push a los usuarios que han sido agregados a un grupo
	async sendGroupNotification(users: any, room: any) {
		let body: any = {
			titulo: 'Nuevo grupo',
			conversacionId: room.conversacion_id,
			usuarios: users,
			mensaje: `Nuevo grupo @ ${room.nombre}`
		};
		await this.request
			.post(chatConfig.endpoints.newApi.post.notification, body, true)
			.then((response: any) => { })
			.catch((error: any) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
	}
}