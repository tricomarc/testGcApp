import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';

import { UtilProvider } from "../../shared/providers/util/util";

@Component({
	selector: 'external-site',
	templateUrl: 'external-site.html'
})
export class ExternalSiteComponent {

	private url: any = null;

	constructor(
		private navParams: NavParams,
		private domSanitizer: DomSanitizer,
		private util: UtilProvider
	) { }

	ionViewDidLoad() {
		if (this.navParams.data.url) this.url = this.domSanitizer.bypassSecurityTrustResourceUrl(this.navParams.data.url);
	}
}

