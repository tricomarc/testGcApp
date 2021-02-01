import { Component, NgZone } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';

import * as SignaturePad from 'signature_pad';

import { UtilProvider } from "../../shared/providers/util/util";

@Component({
	selector: 'signature-viewer',
	templateUrl: 'signature-viewer.html'
})
export class SignatureViewerComponent {

	private signaturePad: SignaturePad.default;
	private disabled: boolean = true;

	constructor(
		public viewController: ViewController,
		public navParams: NavParams,
		public util: UtilProvider,
		public ngZone: NgZone) {
	}

	ionViewDidLoad() {

		const canvas = document.querySelector('canvas');
		const context = this;

		this.signaturePad = new SignaturePad.default(canvas, {
			minWidth: 0.75, // 1.5
			maxWidth: 0.75, // 1.5
			penColor: 'rgb(0, 0, 0)',
			onEnd: () => {
				context.disabled = false;
			},
			throttle: 0,
			backgroundColor: 'rgb(255,255,255)'
		});

		this.util.showAlert('Atención', 'Una vez lista la firma no puede volver a editarla.')
	}

	drawComplete() {

		if(this.signaturePad.isEmpty()) {
			this.util.showAlert('Atención', 'Debe adjuntar su firma.');
			this.disabled = true;
			return;
		}

		const dataUrl = this.signaturePad.toDataURL();
		console.log('DATA URL', dataUrl )

		localStorage.setItem('checklist_signature_' + this.navParams.data.checklist_id, dataUrl);
		this.util.showAlert('Atención', 'Una vez enviada la firma no puede editarla.')
		
		this.viewController.dismiss({ image: dataUrl });
	}

	drawClear() {
		this.signaturePad.clear();
		this.disabled = true;
	}

	drawCancel() {
		this.viewController.dismiss(null);
	}
}
