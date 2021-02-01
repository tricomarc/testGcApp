import { Component, Input } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

@Component({
	selector: 'branch-office-users',
	templateUrl: 'branch-office-users.html'
})
export class BranchOfficeUsers {

	private branchOffice: any = null;

	constructor(private viewCtrl: ViewController, private navParams: NavParams, private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) { }

	ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'BranchOfficeUsersVisual' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'BranchOfficeUsers', 'Visual' );
		
		if(!this.navParams.data.branchOffice) {
			this.dismissModal();
			return;
		}

		this.branchOffice = this.navParams.data.branchOffice;
	}

	// Cierra el modal
	dismissModal() {
		this.viewCtrl.dismiss({ type: null, filter: null });
	}
}