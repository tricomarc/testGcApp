import { Component, ViewChild, NgZone, EventEmitter } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import Moment from 'moment';
import { extendMoment } from 'moment-range';
import {
	NavParams,
	NavController,
	Events,
	Content,
	MenuController,
	ActionSheetController,
	Platform,
	ModalController
} from 'ionic-angular';
import { FileChooser } from '@ionic-native/file-chooser';
import { File, FileEntry, Metadata } from '@ionic-native/file';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import { MediaCapture, CaptureVideoOptions, CaptureError, CaptureAudioOptions } from '@ionic-native/media-capture';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Media, MediaObject } from '@ionic-native/media';
import { IOSFilePicker } from '@ionic-native/file-picker';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { Diagnostic } from '@ionic-native/diagnostic';
import { UUID } from 'angular2-uuid';
import * as mime from 'mime-types';

import { UtilProvider } from '../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { CameraProvider } from '../../../../shared/providers/camera/camera';

import { ChatLocalProvider } from '../../services/chat.local';
import { MesiboProvider } from '../../../../shared/providers/mesibo/mesibo';
import { MesiboCordova } from '../../../../shared/custom-plugins/mesibo.plugin';
import { ChatPage } from '../../chat';
import { RoomInfoComponent } from '../room-info/room-info';

import { chatConfig } from '../../chat.config';
import { globalConfig } from '../../../../config';

import { find, delay, map, filter, isNumber, includes } from 'lodash';
import { global } from '../../../../shared/config/global';
import { Room } from '../../interfaces/room';
import { File as mFile } from '../../interfaces/file';
import { Message } from '../../interfaces/message';
import { ISession } from '../../../../shared/interfaces/session.interface';
import { IRoomDate } from '../../interfaces/room-date.interface';
import { User } from '../../interfaces/user';
import { IMetaDataFile } from '../../interfaces/metadata-file.interface';
import { Activity } from '../../interfaces/activity';
import { ITyping } from '../../interfaces/typing.interface';
import { ISchedule } from '../../interfaces/schedule.interface';
import { CameraComponent } from '../../../../shared/providers/camera/component/camera';

declare var cordova: any;

@Component({
	selector: 'room',
	templateUrl: 'room.html'
})

export class RoomComponent {

	@ViewChild(Content) content: Content;
	@ViewChild('textAreaInput') textAreaInput;

	private room: Room = new Room();
	private rooms: Room[] = new Array<Room>();
	private dates: IRoomDate[] = new Array<IRoomDate>();
	private session: ISession = SessionProvider.state.value;
	private messageInput: string = '';
	private moment = extendMoment(Moment);
	private isReading: boolean = true;
	private keyBoardSubscriber: any = null;
	private showScrollToBottom: boolean = false;
	private messageSubject: BehaviorSubject<number> = new BehaviorSubject<number>(null);
	private userAvailable: boolean = false;
	private showNewMessage: boolean = false;
	private fileUpload = {
		uploading: false,
		name: null,
		progress: 0,
		color: global.client_colors.primary
	};
	private transfer: FileTransferObject = null;
	private storageDirectory: string = null;
	private mediaParams = {
		maxVideoDuration: 60,
		maxAudioDuration: 180,
		maxFileSize: 10
	};
	private recordingAudio: boolean = false;
	private keyboardOpen: boolean = false;
	private os: string = null;
	private onKeyboardShow: any;
	private onKeyboardHide: any;
	private queue: Message[] = new Array<Message>();
	private lockInputs: boolean = false;

	public static currentRoomId: number = null;

	private onRecord: EventEmitter<any> = new EventEmitter<any>();

	private schedule: ISchedule = {
		isModuleActive: false,
		failedRequest: false,
		secondsLeft: 0
	};

	private view: string = null;
	constructor(
		private navParams: NavParams,
		private navCtrl: NavController,
		private events: Events,
		private zone: NgZone,
		private menu: MenuController,
		private fileChooser: FileChooser,
		private file: File,
		private fileTransfer: FileTransfer,
		private actionSheet: ActionSheetController,
		private mediaCapture: MediaCapture,
		private sqlite: SQLite,
		private platform: Platform,
		private media: Media,
		private modal: ModalController,
		private filePicker: IOSFilePicker,
		private diagnostic: Diagnostic,
		private mesiboCordova: MesiboCordova,
		private mesiboProvider: MesiboProvider,
		private util: UtilProvider,
		private requestProvider: RequestProvider,
		private cameraProvider: CameraProvider,
		private chatLocalProvider: ChatLocalProvider
	) {
		if (this.platform.is('cordova')) {
			if (this.platform.is('ios')) {
				this.storageDirectory = cordova.file.documentsDirectory;
			} else if (this.platform.is('android')) {
				this.storageDirectory = cordova.file.dataDirectory;
			}
		}
	}

	// Método que se ejecuta cuando carga la vista
	async ionViewDidLoad() {
		this.schedule = this.navParams.data.schedule;
		this.os = (this.platform.is('ios') ? 'ios' : 'android');
		// this.testDb();
		this.menu.enable(false, "menu");
		SessionProvider.state.subscribe((value: ISession) => this.session = value);
		try {
			// Detenemos cualquier sesión de lectura anterior
			this.mesiboCordova.stopReadDbSession();
		} catch (e) { }

		// Validamos que venga la info de la sala
		if (!this.navParams.data.room) {
			this.navCtrl.pop();
			return;
		}

		this.setMediaParams();
		this.room = this.navParams.data.room;
		this.rooms = this.navParams.data.rooms;

		this.mesiboCordova.getProfile({
			isGroup: this.room.isGroup,
			peer: this.room.peer,
			groupId: this.room.groupId
		})
			.then((profile) => console.log('profile', profile));

		this.queue = await this.chatLocalProvider.getRoomQueueMessages(this.room);

		this.checkAvailableRoomUsers();

		RoomComponent.currentRoomId = this.room.id;

		// Nos suscribimos al evento que nos indica cuando llega un nuevo mensaje
		this.events.subscribe('on-message', (message: Message) => {
			if(!this.room.isGroup && message.groupId != 0) return;
			// Si el mensaje pertenece a esta sala y no está agregado, lo mostramos
			if (
				(
					(this.room.isGroup && message.groupId === this.room.groupId)
					|| (!this.room.isGroup && message.peer === this.room.peer)
				) && !this.isMessageInConversation(message)
			) {
				if (this.keyboardOpen && !this.showScrollToBottom) {
					delay(() => this.scrollToBottom(300), 1000);
				}
				this.addMessage(message);
			}
		});

		// Nos suscribimos al evento que nos indica cuando cambia el estado de un mensaje
		this.events.subscribe('on-message-status', (message: Message) => {
			this.setMessageStatus(message);
		});

		this.events.subscribe('on-activity', (activity: Activity) => {
			if(!this.room.isGroup && activity.groupId != 0) return;
			if (activity.value === 1 || activity.value === 2) {
				const typing: ITyping = { value: activity.value, user: null };
				if (this.room.isGroup) {
					if (activity.groupId === this.room.groupId) {
						const user: User = find(this.room.users, (usr: User) => {
							return usr.id == activity.profile.address;
						});
						if (user) {
							typing.user = user.name;
						}
						this.zone.run(() => this.room.typing = typing);
					}
				} else {
					if (activity.peer === this.room.peer) {
						this.zone.run(() => this.room.typing = typing);
					}
				}
			}
		});

		this.events.subscribe('chat-updated-room-detail', (data: any) => {
			if (data && data.room && data.room.id && (this.room.id === data.room.id)) {
				this.room.users = data.room.users;
				if (data.messagesDeleted === true) {
					this.dates = [];
				}
				this.checkAvailableRoomUsers();
			}
		});

		this.onKeyboardShow = (evt) => {
			this.keyboardOpen = true;
			this.scrollToBottom(0);
			try {
				this.content.resize();
			} catch (e) { }
		}

		this.onKeyboardHide = (evt) => {
			this.keyboardOpen = false;
			try {
				this.content.resize();
			} catch (e) { }
		}

		window.addEventListener('keyboardDidShow', this.onKeyboardShow, true);
		window.addEventListener('keyboardDidHide', this.onKeyboardHide, true);

		this.content.ionScrollEnd.subscribe((event: any) => {
			if (!event) return;
			if (event.scrollTop <= 0) {
				this.readRoomMessages();
			}
			if ((event.scrollTop + this.content.getContentDimensions().contentHeight + 200) < this.content.getContentDimensions().scrollHeight) {
				this.zone.run(() => this.showScrollToBottom = true);
				return;
			}
			this.zone.run(() => {
				this.showScrollToBottom = false;
				this.showNewMessage = false;
			});
		});

		this.messageSubject
			.debounceTime(300)
			.subscribe((activity) => {
				if (activity) {
					this.mesiboProvider.sendActivity(activity, this.room.peer, this.room.groupId, this.room.id, this.session.userId.toString());
				}
			});

		this.events.subscribe('app-paused', () => {
			this.mesiboProvider.sendActivity(1, this.room.peer, this.room.groupId, this.room.id, this.session.userId.toString());
		});

		this.events.subscribe('app-resumed', () => {
			if (this.messageInput) {
				this.mesiboProvider.sendActivity(2, this.room.peer, this.room.groupId, this.room.id, this.session.userId.toString());
			} else {
				this.mesiboProvider.sendActivity(1, this.room.peer, this.room.groupId, this.room.id, this.session.userId.toString());
			}
		});

		this.events.subscribe('chat-module-change', (schedule: ISchedule) => {
			this.schedule = schedule;
		});

		this.readRoomMessages();
		setTimeout(() => {
			this.isReading = false;
			this.scrollToBottom(0);
		}, 500);
	}

	checkAvailableRoomUsers() {
		let userAvailable = false;
		for (let user of this.room.users) {
			if (!user.isMyUser && !user.deletedAt) {
				userAvailable = true;
				break;
			}
		}
		this.userAvailable = userAvailable;
	}

	ionViewWillEnter() {
		this.events.publish('changeDisplayOption', true);
	}

	ionViewWillLeave() {
		this.menu.enable(true, 'menu');
		this.events.publish('changeDisplayOption', false);
	}

	ionViewWillUnload() {
		if (this.queue.length) this.chatLocalProvider.saveMessagesInQueue(this.queue);
		// Dejamos de escuchar los eventos de mensajes nuevos y cambios de estados
		this.events.unsubscribe('on-message');
		this.events.unsubscribe('on-message-status');
		this.events.unsubscribe('chat-updated-room-detail');
		this.events.unsubscribe('on-activity');
		this.events.unsubscribe('chat-module-locked');
		window.removeEventListener('keyboardDidShow', this.onKeyboardShow, true);
		this.events.unsubscribe('app-paused');
		this.events.unsubscribe('app-resumed');
		window.removeEventListener('keyboardDidHide', this.onKeyboardHide, true);
		this.events.publish('on-room-closed', { room: this.room, openFromNotification: this.navParams.data.openFromNotification });
		this.content.ionScrollEnd.unsubscribe();
		this.messageSubject.next(1);
		RoomComponent.currentRoomId = null;
		delay(() => this.messageSubject.unsubscribe(), 300);
		try {
			this.mesiboCordova.stopReadDbSession();
		} catch (e) { }
	}

	// Enviamos un nuevo mensaje a la sala
	async sendMessage() {

		// Validamos que el mensaje no esté vacío
		if (!this.messageInput) return;

		const message: Message = new Message();

		message.content = this.messageInput;
		message.resent = false;
		message.sender = this.session.userId.toString();

		// Si el chat no está activo, guardamos localmente el mensaje para luego enviarlo
		/* if (!this.schedule.isModuleActive) {
			message.time = new Date().getTime();
			message.pending = true;
			message.isIncoming = false;
			message.status = { value: 0, label: "Enviando", code: "OUTBOX", icon: "md-time", class: "msg-sending" };
			message.type = 1;
			message.file = null;
			message.reference = null;
			message.peer = this.room.peer;
			message.groupId = this.room.groupId;
			message.owner = find(this.room.users, (user: User) => {
				return user.id.toString() === message.sender;
			});

			const success: boolean = await this.scheduleMessage(message);

			if (success) {
				this.saveCustomMessage(message);
				this.messageInput = '';
				this.scrollToBottom(0);
				this.resizeTextArea();

				delay(() => {
					this.messageSubject.next(1)
				}, 300);
				return;
			}

			this.util.showToast('No ha sido posible enviar el mensaje.', 3000)
			return;
		} */

		this.lockInputs = true;

		// Enviamos el mensaje a través de Mesibo
		this.mesiboCordova
			.sendMessage({
				peer: this.room.peer,
				groupId: this.room.groupId,
				message: JSON.stringify(message),
				sender: this.session.userId.toString(),
				type: 1
			})
			.then((response: Message) => {
				// Si recibimos un id del mensaje quiere decir que se ha enviado
				if (response && response.id) {
					this.lockInputs = false;
					this.zone.run(() => {
						const message: Message = Message.responseToObject(response);
						message.owner = find(this.room.users, (user: User) => {
							return user.id.toString() === message.sender;
						});
						this.addMessage(message);
						this.sendMessageNotification(message);
						this.messageInput = '';
						this.scrollToBottom(0);
						this.resizeTextArea();
					});

					delay(() => {
						this.messageSubject.next(1);
					}, 300);
				}
			})
			.catch((error: any) => {
				this.lockInputs = false;
				this.util.logError(JSON.stringify(error), chatConfig.errors.sendMessage, globalConfig.version);
			});
	}

	// Scrollea la vista hasta el último mensaje
	scrollToBottom(duration: number) {
		try {
			this.content.resize();
		} catch (e) { }
		setTimeout(() => {
			try {
				this.content.scrollToBottom(duration);
				this.showScrollToBottom = false;
			} catch (e) { }
		}, 300);
	}

	// Lee los mensajes de un profile (Chat 1 a 1 o grupal)
	readRoomMessages() {
		let body: any = {
			address: this.room.peer,
			groupId: this.room.groupId,
			messageCount: 30,
			enableFifo: false,
			enableReadReceipt: true
		};
		this.mesiboCordova
			.readRoomMessages(body)
			.then((response) => {
				// Los mensajes llegarán a través del evento 'on-message' definido en 'ionViewDidLoad()'
			})
			.catch((error) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
	}

	// Muestra la información de una sala
	showRoomInfo(room: any) {
		if (!room) return;
		this.navCtrl.push(RoomInfoComponent, { room: room, rooms: this.rooms });
	}

	messagePressed(message: any) {
		/*let popover = this.popoverController.create(PopoverMessageComponent);
		popover.present();*/
	}

	// Solicita al servicio enviar una notificación push del mensaje enviado a el/los usuario(s) de esta sala
	async sendMessageNotification(message: Message) {
		const selfUser: User = find(this.room.users, { isMyUser: true });
		const body: any = {
			titulo: (this.room.isGroup ? (`${selfUser.name} @ ${this.room.name}`) : selfUser.name),
			conversacionId: this.room.id,
			usuarios: map(filter(this.room.users, (user: User) => {
				return !user.isMyUser && !user.muted && !user.inRoom;
			}), 'id'),
			mensaje: (message.type === 1 ? message.content : this.getNotificationLabel(message))
		};

		if (!body.mensaje) return;

		await this.requestProvider
			.post(chatConfig.endpoints.newApi.post.notification, body, true)
			.then((response: any) => { })
			.catch((error: any) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
	}

	getNotificationLabel(message: Message) {
		if (message.type === 2) {
			const showAs: string = mFile.getShowAs(message.file.type);
			if (showAs === 'image') return 'Imagen adjunta';
			if (showAs === 'video') return 'Video adjunto';
			if (showAs === 'audio') return 'Audio adjunto';
			return 'Archivo adjunto';
		}
		return null;
	}

	popView() {
		this.navCtrl.popToRoot({ animate: false });
	}

	setMediaParams() {
		this.requestProvider.get(chatConfig.endpoints.newApi.get.mediaParams, true)
			.then((response: any) => {
				if (response && response.data) {
					this.mediaParams.maxAudioDuration = (isNumber(response.data.audio_duration) ? response.data.audio_duration : this.mediaParams.maxAudioDuration);
					this.mediaParams.maxFileSize = (isNumber(response.data.file_size) ? response.data.file_size : this.mediaParams.maxFileSize);
					this.mediaParams.maxVideoDuration = (isNumber(response.data.video_duration) ? response.data.video_duration : this.mediaParams.maxVideoDuration);
				}
			})
			.catch(e => { try { this.util.logError(JSON.stringify(e), null, globalConfig.version); } catch (e) { } });
	}

	// Verifica si el mensaje que entra por parámetro ya existe o no en la conversación
	isMessageInConversation(message: Message): boolean {
		const messageDateLabel: string = this.moment(message.time).format("DD/MM/YYYY");
		const date: IRoomDate = find(this.dates, (d: IRoomDate) => {
			return d.label === messageDateLabel;
		});

		if (!date) return false;

		const temp: Message = find(date.messages, { id: message.id });
		if (!temp) return false;
		return true;
	}

	call(isVideoCall: boolean) {
		const params = { peer: this.room.peer, isVideoCall: isVideoCall, groupId: this.room.groupId };
		this.mesiboCordova.call(params).then((data) => {
			const message: Message = new Message();
			message.content = `${isVideoCall ? 'Videollamada' : 'Llamada'} entrante, conéctate para responderla.`;
			this.sendMessageNotification(message);
		}).catch((error) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
	}

	typing() {
		const activity: number = this.messageInput ? 2 : 1;
		if (!this.messageInput.replace(/\s/g, '').length) {
			this.messageInput = '';
		}
		this.messageSubject.next(activity);
		this.resizeTextArea();
	}

	async sendFile(file: string) {

		if (!file) return;

		this.lockInputs = true;

		let fileEntry: FileEntry = null;
		await this.file.resolveLocalFilesystemUrl(file).then((r: FileEntry) => fileEntry = r).catch(e => { try { this.util.logError(JSON.stringify(e), null, globalConfig.version); } catch (e) { } });

		let metaData: IMetaDataFile = null;
		let mbSize: number = null;
		await new Promise((resolve) => {
			fileEntry.file((m) => {
				mbSize = (m.size / (1024 * 1024));
				resolve({
					name: m.name,
					size: this.bytesToSize(m.size),
					type: m.type
				});
			}, (e) => { })
		}).then((r: IMetaDataFile) => metaData = r).catch(e => { try { this.util.logError(JSON.stringify(e), null, globalConfig.version); } catch (e) { } });

		if (fileEntry.nativeURL && this.platform.is('ios')) {
			file = fileEntry.nativeURL;
		}

		if (mbSize > this.mediaParams.maxFileSize) {
			this.util.showToast(`El archivo que intenta enviar supera el máximo establecido: ${this.mediaParams.maxFileSize} MB.`, 3000);
			this.lockInputs = false;
			return;
		}

		this.fileUpload.uploading = true;
		this.fileUpload.progress = 0;

		delay(() => this.scrollToBottom(0), 300);

		if (!includes(fileEntry.name, '.')) {
			const extension = mime.extension(metaData.type);
			if (extension && extension !== 'false') {
				fileEntry.name += '.' + mime.extension(metaData.type);
			}
		}

		const upload: any = await this.uploadFile(file, fileEntry.name).then().catch(e => { try { this.util.logError(JSON.stringify(e), null, globalConfig.version); } catch (e) { } });

		this.transfer = null;

		if (!upload || !upload.data || !upload.data.path) {
			this.util.showToast('Archivo no enviado, intente nuevamente.', 3000);
			this.fileUpload.uploading = false;
			this.lockInputs = false;
			return;
		}

		await this.mesiboCordova.sendMessage({
			peer: this.room.peer,
			groupId: this.room.groupId,
			message: JSON.stringify({
				content: '',
				file: {
					url: upload.data.path,
					size: metaData.size,
					type: metaData.type,
					name: fileEntry.name
				},
				resent: false,
				sender: this.session.userId.toString()
			}),
			sender: this.session.userId.toString(),
			type: 2
		}).then((response: Message) => {
			if (response.id) {
				this.zone.run(() => {
					const message: Message = Message.responseToObject(response);
					message.owner = find(this.room.users, (user: User) => {
						return user.id.toString() === message.sender;
					});
					this.addMessage(message);
					this.scrollToBottom(0);
					this.sendMessageNotification(message);
				});
			}
		}).catch(e => { });
		this.fileUpload.uploading = false;
		this.fileUpload.progress = 0;
		this.lockInputs = false;
	}

	async getPicture(fromCameraPlugin?: boolean): Promise<string> {
		let file: string = null;
		if (fromCameraPlugin) {
			await this.cameraProvider
				.getPhoto({ destinationType: 1 }, globalConfig.isBrowser, globalConfig.version)
				.then((picture: any) => { file = picture; })
				.catch((error) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		} else {
			file = await this.getImageCamera();
		}
		return file;
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
    

	async getGallery(): Promise<string> {
		let file: string = null;
		await this.cameraProvider
			.getPhoto({
				destinationType: 1,
				sourceType: 0
			}, globalConfig.isBrowser, globalConfig.version)
			.then((picture: any) => {
				file = picture;
			})
			.catch((error) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		return file;
	}

	async chooseFile() {
		let file: string = null;

		if (this.platform.is('ios')) {
			await this.filePicker.pickFile()
				.then((uri: any) => {
					file = 'file://' + uri;
				})
				.catch((error) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		} else {
			await this.fileChooser.open()
				.then((uri: any) => {
					file = uri;
				})
				.catch((error) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		}
		return file;
	}

	bytesToSize(bytes: number) {
		var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		if (bytes == 0) return 'n/a';
		var i = parseInt((Math.floor(Math.log(bytes) / Math.log(1024))).toString());
		if (i == 0) return bytes + ' ' + sizes[i];
		return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
	};

	addMessage(message: Message) {
		const messageDateLabel: string = this.moment(message.time).format("DD/MM/YYYY");
		const date: IRoomDate = find(this.dates, (d: IRoomDate) => {
			return d.label === messageDateLabel;
		});

		if (date) {
			date.messages.push(message);
		} else {
			const newDate = {
				label: messageDateLabel,
				value: message.time,
				messages: [message],
				alternativeLabel: (
					this.moment(new Date()).format("DD/MM/YYYY") === messageDateLabel ? 'Hoy' :
						(this.moment(new Date()).subtract(1, 'day').format("DD/MM/YYYY") === messageDateLabel ? 'Ayer' : null)
				)
			};
			this.dates.push(newDate);
		}

		if (
			this.showScrollToBottom
			&& message.isIncoming
			&& (message.status.value !== 3 && message.status.value !== 19)
			&& this.moment(new Date()).format("DD/MM/YYYY") === messageDateLabel
		) {
			this.showNewMessage = true;
		}
	}

	setMessageStatus(message: Message) {
		const messageDateLabel: string = this.moment(message.time).format("DD/MM/YYYY");
		const date: IRoomDate = find(this.dates, (d: IRoomDate) => {
			return d.label === messageDateLabel;
		});
		if (!date) return;

		const temp: Message = find(date.messages, { id: message.id });
		if (!temp) return;

		temp.status = message.status;
	}

	resizeTextArea() {
		try {
			const children = (this.textAreaInput._elementRef.nativeElement.children.length ? this.textAreaInput._elementRef.nativeElement.children[0] : null);
			if (children) {
				children.style.height = (
					(this.messageInput.length + ((this.messageInput.match(/\n/g) || []).length * 25)) < 25 ? 38
						: (children.scrollHeight < 38 ? 38 : children.scrollHeight)
				) + 'px';
				try {
					delay(() => {
						try {
							this.content.resize();
						} catch (e) { }
					}, 200);
				} catch (e) { }
			}
		} catch (e) { }
	}

	uploadFile(file: string, name: string): Promise<any> {
		return new Promise((resolve, reject) => {

			this.transfer = this.fileTransfer.create();
			const options: FileUploadOptions = {
				fileKey: 'file',
				fileName: name.replace(/ /g, ''),
				headers: { 'Authorization': this.session.token },
				params: {
					usuario_id: this.session.userId,
					conversacion_id: this.room.id
				}
			};

			// Comenzamos con la subida del archivo
			this.transfer.upload(file, (`${global.API_NEW}/usuarios/setFileMesibo`), options)
				.then((result: any) => {
					if (result.response) {
						try {
							const temp = JSON.parse(result.response);
							resolve(temp);
						} catch (e) {
							reject({ error: 'La respuesta no es un json.', nativeError: e });
						}
					} else {
						reject({ error: 'No hubo respuesta.', nativeError: null });
					}
				})
				.catch((error: any) => {
					try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
					reject({ error: 'No ha sido posible subir el archivo.', nativeError: error });
				});

			this.transfer.onProgress((response) => {
				if (response.lengthComputable) {
					this.zone.run(() => {
						this.fileUpload.progress = (Math.round((response.loaded / response.total) * 100));
					});
				}
			});
		});
	}

	abortUpload() {
		if (this.transfer) {
			try {
				this.transfer.abort();
			} catch (e) { }
		}
		this.fileUpload.uploading = false;
		this.fileUpload.progress = 0;
	}

	async getVideo() {
		let video: string = null;
		const videoOptions: CaptureVideoOptions = {
			limit: 1,
			quality: 0.8,
			duration: this.mediaParams.maxVideoDuration
		};
		await this.mediaCapture
			.captureVideo(videoOptions)
			.then(async (data: any) => {
				if (data && data[0]) {
					if (this.platform.is('ios')) {
						video = 'file://' + data[0].fullPath;
					} else {
						video = data[0].fullPath;
					}
				}
			})
			.catch((error: CaptureError) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		return video;
	}

	showAttachOptions() {
		let option: string = null;
		const actionSheet = this.actionSheet.create({
			buttons: [
				{
					text: 'Archivo',
					icon: 'ios-document-outline',
					handler: () => { option = 'file'; }
				}, {
					text: 'Fotografía',
					icon: 'ios-camera-outline',
					handler: () => { option = 'photo'; }
				}, {
					text: 'Video',
					icon: 'ios-videocam-outline',
					handler: () => { option = 'video'; }
				}, {
					text: 'Galería',
					icon: 'ios-images-outline',
					handler: () => { option = 'gallery'; }
				}, {
					text: 'Audio',
					icon: 'ios-mic-outline',
					handler: () => { option = 'audio'; }
				}
			]
		});
		actionSheet.present();
		actionSheet.onDidDismiss(async () => {
			if (!option) return;
			let file: string = null;
			if (option === 'photo') {
				file = await this.getPicture();
			} else if (option === 'video') {
				file = await this.getVideo();
			} else if (option === 'audio') {
				this.recordAudio();
			} else if (option === 'file') {
				file = await this.chooseFile();
			} else if (option === 'gallery') {
				file = await this.getGallery();
			}
			if (file) this.sendFile(file);
		});
	}

	async recordAudio() {
		this.diagnostic.isMicrophoneAuthorized().then((result: boolean) => {
			if (result) {
				this.zone.run(() => this.recordingAudio = true);
				this.onRecord.next(true);
				try { this.content.resize(); } catch (e) { }
			} else {
				this.diagnostic.requestMicrophoneAuthorization()
					.then((status) => {
						if (status === this.diagnostic.permissionStatus.GRANTED) {
							this.zone.run(() => this.recordingAudio = true);
							this.onRecord.next(true);
							try { this.content.resize(); } catch (e) { }
							return;
						}
						this.util.showToast('Nota de voz no disponible.', 3000)
					})
					.catch((e) => this.util.showToast('Nota de voz no disponible.', 3000))
			}
		})
			.catch((e) => this.util.showToast('Nota de voz no disponible.', 3000));
	}

	onCancelRecord() {
		this.zone.run(() => this.recordingAudio = false);
	}

	onSendRecord(path: string) {
		if (!this.recordingAudio) return;
		this.zone.run(() => this.recordingAudio = false);
		if (path) this.sendFile(path);
	}

	showCameraOptions() {
		let option: string = null;
		const actionSheet = this.actionSheet.create({
			buttons: [
				{
					text: 'Fotografía',
					icon: 'ios-camera-outline',
					handler: () => { option = 'photo'; }
				}, {
					text: 'Video',
					icon: 'ios-videocam-outline',
					handler: () => { option = 'video'; }
				}, {
					text: 'Galería',
					icon: 'ios-images-outline',
					handler: () => { option = 'gallery'; }
				}
			]
		});
		actionSheet.present();
		actionSheet.onDidDismiss(async () => {
			if (!option) return;
			let file: string = null;
			if (option === 'photo') {
				file = await this.getPicture();
			} else if (option === 'video') {
				file = await this.getVideo();
			} else if (option === 'gallery') {
				file = await this.getGallery();
			}
			if (file) this.sendFile(file);
		});
	}

	async scheduleMessage(message: Message) {
		message.content = message.content.replace('&', ' ');
		let success: boolean = false;
		const url: string = `https://api.mesibo.com/api.php?op=message&token=uj8739y10l37omtrwss8p3m6lardr4shz20wqz4kz8z09v6s42j7cdhhga1u7ydf
		&from=${message.sender}
		${this.room.isGroup ? ("&gid=" + message.groupId) : ("&to=" + message.peer)}
		&type=${message.type}
		&when=${60}
		&msg=${JSON.stringify(message)}`;

		await this.requestProvider.mesiboRequest(url)
			.then((response: any) => {
				if (response.result === true) success = true;
			})
			.then(error => { });
		return success;
	}

	saveCustomMessage(message: Message) {
		this.mesiboCordova.saveCustomMessage({
			id: ((isNumber(message.id) && message.id > 0) ? message.id : 0),
			peer: this.room.peer,
			groupId: this.room.groupId,
			message: JSON.stringify(message),
			sender: this.session.userId.toString(),
			type: 1
		})
			.then((response) => { })
			.catch((error) => { });
	}

	/* testDb() {
		this.sqlite.create({
			name: 'mesibochat-57002.db',
			location: '/data/data/cl.demo.gcapp/files/Mesibo/Databases/',
			iosDatabaseLocation: 'Library'
		})
			.then((db: SQLiteObject) => {
				db.executeSql("SELECT * FROM sqlite_master;", []).then((a) => {
					const asco = [];
					for (let i = 0; i < a.rows.length; i++) {
						let item = a.rows.item(i);
						// do something with it

						asco.push(item);
					}
				}).catch(e => console.log('e', e))
			})
			.catch(e => console.log('sqlite e', e));

	} */
}