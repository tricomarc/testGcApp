import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import {
	LoadingController,
	MenuController,
	Events,
	AlertController,
	ModalController,
	Platform,
	ActionSheetController,
	Content
} from 'ionic-angular';

import { Geolocation, GeolocationOptions } from '@ionic-native/geolocation';
import { Diagnostic } from '@ionic-native/diagnostic';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Storage } from "@ionic/storage";

import * as _ from 'lodash';

import { sha256 } from 'js-sha256';

// Configuración global
import { global } from '../../shared/config/global';
import { globalConfig } from '../../config';

import { trucksPatents } from '../ver-rutas/ver-rutas.config';

import { UtilProvider } from '../../shared/providers/util/util';
import { LocalizaProvider } from '../../shared/providers/localiza/localiza';

import { DetalleRutaPage } from './detalle-ruta/detalle-ruta';
import { FirebaseAnalyticsProvider } from '../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
	selector: 'page-ver-rutas',
	templateUrl: 'ver-rutas.html',
})

export class VerRutasPage {
	private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado
	private patents = trucksPatents;

	constructor( public navCtrl: NavController, 
		public navParams: NavParams,
		private util: UtilProvider,
		private menu: MenuController,
		private loading: LoadingController,
		private events: Events,
		private actionSheet: ActionSheetController,
		private geolocation: Geolocation,
		private locationAccuracy: LocationAccuracy,
		private zone: NgZone,
		private localiza: LocalizaProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider){
	}

	ionViewWillEnter(){
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'VerRutas' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'VerRutas', 'VerRutas' );


		// funcion encriptadora para acceder al sistema de localiza
		this.passCrypto();

		// Habilito el menu
		this.menu.enable(true, "menu");
		this.menu.swipeEnable(false, "menu");
	}

	truckDetails( placa:any ){
		this.navCtrl.push( DetalleRutaPage, { selectedPatent: placa } );
	}

	// Creamos la clave para ahcer la consulta al servicio
	passCrypto(){
		let date: Date = new Date(),
			day: any = date.getDate(),
			month: any = date.getMonth() + 1,
			encript = 'teal'.concat( day, month ),
			crypto = sha256.hmac('1234', encript);
		
		let data = {
			empresa: "TEAL",
			cliente: "404",
			usuario: "teal",
			cript: crypto, //agregamos la clave
			//fecha_inicio: "2019-10-15 00:00:00",
			//fecha_fin: "2019-10-15 23:59:59",
			vehiculo: { patente: "GH-CF50" }
		}
		
		console.log( 'clave encriptada', crypto );
	
		
		this.localiza.getLastposition( data ).then( res => {
			console.log( res );
		} ).catch( ( err )  => {
			console.log( err )
		});
		

	}	
}
