import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';


@Injectable()
export class FirebaseAnalyticsProvider {

	private firebaseAnalytics: any;

	constructor(public platform: Platform) {
		
		this.platform.ready().then( () => {
			this.firebaseAnalytics = (<any>window).FirebasePlugin;
		} ).catch( (err) => {
			
		} );
	}
	
	// TRACK DE USUARIO ID
	trackUserId( userID: string ){
		try {
			this.firebaseAnalytics.setUserId( userID );
		} catch ( err ) {
			
		}
	}

	// TRACK DE USER PROPERTIES
	trackUserProperty( userID: string, userProperty: string ){
		try{
			this.firebaseAnalytics.setUserProperty( userID, userProperty );
		}catch ( err ){
			
		}
	}

	// TRACKER DE LOGIN
	trackLoginEvent(  ){
		try {
			this.firebaseAnalytics.logEvent( "login", { method: "usual" } );
		} catch ( err ) {
			
		}
	}

	// TRACKER DE BUTTONS
	trackButtonEvent( button_name: string ){
		this.firebaseAnalytics.logEvent( "select_content", { button_name: button_name } );
	}

	// TRACKER DE VISTA
	trackView( screenName: string ){
		try {
			this.firebaseAnalytics.setScreenName( screenName );
		} catch ( err ) {
			
		}
	}

	// TRACKER DE VISTA
	trackView2( screenName: string, screenClass: string ){
		try {
			this.firebaseAnalytics.setScreenName( screenName, { screenClass: screenClass } );
		} catch ( err ) {
			
		}
	}
}
