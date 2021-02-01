import { Component, Input, OnInit } from '@angular/core';
import { ActionSheetController, Platform, ToastController } from 'ionic-angular';
import { ImageViewerController } from 'ionic-img-viewer';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer';
import { File } from '@ionic-native/file';
import { includes } from 'lodash';
import { FileOpener } from '@ionic-native/file-opener';

import { UtilProvider } from '../../../../shared/providers/util/util';

import { Message } from '../../interfaces/message';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { Observable } from 'rxjs';

@Component({
    selector: 'message-detail',
    templateUrl: 'message-detail.html'
})

export class MessageDetailComponent implements OnInit {

    @Input() message: Message;
    @Input() position: string;
    @Input() isGroup: boolean;
    @Input() storageDirectory: string;

    private messageOptions: any = null;
    private os: string = null;

    public static playingMessageId: any = null;

    constructor(
        private imgViewer: ImageViewerController,
        private actionSheetController: ActionSheetController,
        private fileTransfer: FileTransfer,
        private file: File,
        private inAppBrowser: InAppBrowser,
        private platform: Platform,
        private toastController: ToastController,
        private fileOpener: FileOpener,
        private utilProvider: UtilProvider,
        private requestProvider: RequestProvider) {
    }

    ngOnInit(): void {
        this.os = this.platform.is('ios') ? 'ios' : 'android';
    }


    openImage(image) {
        if (!includes(image.classList, 'default-image')) {
            const imageViewer = this.imgViewer.create(image);
            imageViewer.present();
        }
    }

    imageLoaded(evt, img) {
        if (evt && img.classList) {
            img.classList.remove('default-image');
            img.classList.add('image-message');
        }
    }

    onPause(id: number) {
        MessageDetailComponent.playingMessageId = null;
    }

    onPlaying(id: number) {
        MessageDetailComponent.playingMessageId = id;
    }

    get playingMessageId() {
        return MessageDetailComponent.playingMessageId;
    }

    messageSelected() {
        try { this.messageOptions.dismiss(); } catch (e) { }
        if (
            this.message.type === 2
            && this.message.file.showAs
            && this.message.file.showAs !== 'audio'
        ) {
            this.messageOptions = this.actionSheetController.create({
                buttons: [
                    {
                        text: 'Descargar',
                        icon: 'ios-cloud-download-outline',
                        handler: () => { this.downloadFile() }
                    }
                ]
            });
            this.messageOptions.present();
        }
    }

    async downloadFile() {
        const transfer: FileTransferObject = this.fileTransfer.create();
        this.message.file.downloading = true;

        const directory: string = this.platform.is('ios')
            ? `${this.file.dataDirectory}`
            : `${this.file.externalRootDirectory}/Download/`;

        await transfer.download(this.message.file.url, `${directory}${this.message.file.name}`)
            .then((entry) => {
                const toast = this.toastController.create({
                    position: 'top',
                    closeButtonText: 'Abrir',
                    duration: 4000,
                    message: 'Archivo descargado.',
                    showCloseButton: true
                });
                toast.onDidDismiss((data, role) => {
                    if (role == "close") {
                        this.fileOpener.open(entry.toURL(), this.message.file.type)
                            .then(() => { })
                            .catch(e => this.utilProvider.showToast('Lo sentimos, no ha sido posible abrir este archivo.', 3000));
                    }
                });
                toast.present();
            })
            .catch((error) => {
                this.utilProvider.showToast('No ha sido posible descargar el archivo, intente nuevamente.', 3000);
            });
        this.message.file.downloading = false;
    }
}