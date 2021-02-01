import { Component, ViewChild } from '@angular/core';
import { NavParams, NavController, Platform, LoadingController, Slides } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';

import { VgAPI } from 'videogular2/core';

import { ImageViewerController } from 'ionic-img-viewer';

import * as _ from 'lodash';

// Proveedores
import { UtilProvider } from '../../shared/providers/util/util';

@Component({
	selector: 'photo-viewer',
	templateUrl: 'photo-viewer.html'
})
export class PhotoViewerComponent {

	@ViewChild(Slides) slides: Slides;

	private photo: any = null;
	private type: any = null;
	private is_video: boolean = false;
	private tracks: any = [];
	private reference: any = null;
	private evaluated: any = false;
	private removed: any = false 
	private corectiveChilds: any = [];

	private correctivePhoto: any;

	private item: any = 'media';

	private temporal_video_url: any = null;

	private is_temporal_url: any = true;

	private loading_instance: any = null;

	private index_played_audio: any = null;

	constructor(private navParams: NavParams,
		private navCrtrl: NavController,
		private platform: Platform,
		private loading: LoadingController,
		private domSanitizer: DomSanitizer,
		private imgViewer: ImageViewerController,
		private util: UtilProvider) {
		try {
			this.photo = this.navParams.data.photo;
			this.type = this.navParams.data.type;
			this.is_video = this.navParams.data.is_video ? true : false;
			this.reference = this.navParams.data.reference ? this.navParams.data.reference : null;
			this.evaluated = this.navParams.data.evaluated ? true : false;
			this.removed = this.navParams.data.removed ? true : false;

			this.corectiveChilds = this.navParams.data.photo.childs ? this.navParams.data.photo.childs: [];
			
			this.correctivePhoto = _.findLast( this.correctivePhoto );

			let reasons_for_approval = [];

			if (this.photo.rechazos && this.photo.rechazos.length) {
				this.photo.motivos_aprobacion = _.filter(this.photo.motivos_aprobacion, (reason) => {
					return !_.find(this.photo.rechazos, { id: reason.id });
				});
			}

			/* En Octubre de 2018, el plugin web view versión 2.2.0 necesario para utilizar Ionic Pro tiene un bug con los local files en android
			por lo cual debemos leer el archivo como base64 santitizarlo y retornalo para poder mostrarlo en la vista (SOLO PARA ANDROID) */

			// Si es un video y de momento tenemos la dirección local, la cambiamos por la dirección en base64
			if (this.is_video && _.includes(this.photo.url, 'file:///') && this.platform.is('android')) {
				this.loading_instance = this.loading.create({ content: 'Cargando video' });
				this.loading_instance.present();
				this.getTemporalVideoUrl();
			} else {
				this.is_temporal_url = false;
			}

			// HACER ACÁ
			_.delay(() => {
				this.slides.update();
			}, 300);

		} catch (e) { }
	}
	
	// Cierra el modal
	closeModal() {
		this.navCrtrl.pop();
	}

	// Obtiene una url temporal para reproducir un video local
	async getTemporalVideoUrl() {
		this.temporal_video_url = await this.util.getSanitizedBase64VideoUrl(this.photo.url);
		
		this.loading_instance.dismiss();
	}

	// Método que se ejecuta cuando se sale de esta vista
	ionViewWillLeave() {
		try {
			if (this.loading_instance) this.loading_instance.dismiss();
		}
		catch (e) { }
	}

	// Cuando se comienza a reproducir un audio se asigna su índice a la variable para no reproducir otros audios simultaneamente
	onPlaying(index: any) {
		this.index_played_audio = index;
	}

	// Cuando se pausa la reprocucción de un audio se libera el índice
	onPause(index: any) {
		this.index_played_audio = null;
	}

	pinch( image: any ) {
		if ( image ) this.openImage( image );
	}

	openImage( image ) {
		const imageViewer = this.imgViewer.create( image );
		imageViewer.present();
	}
}

