import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Plugin, Cordova } from '@ionic-native/core';

@Plugin({
	pluginName: 'cordova-plugin-mesibo',
	plugin: 'cordova-plugin-mesibo',
	pluginRef: 'MesiboCordova',
	repo: 'https://felipefcasas@bitbucket.org/felipefcasas/mesibo.git',
	platforms: ['Android', 'iOS']
})

@Injectable()
export class MesiboCordova {

	constructor() { }

	@Cordova()
	setAccessToken(arg0: IToken): Promise<any> {
		return;
	}

	@Cordova()
	stopMesibo(): Promise<any> {
		return;
	}

	@Cordova()
	sendMessage(arg0: IMessage): Promise<any> {
		return;
	}

	@Cordova()
	saveCustomMessage(arg0: IMessage): Promise<any> {
		return;
	}

	@Cordova()
	sendActivity(arg0: IActivity): Promise<any> {
		return;
	}

	@Cordova()
	sendFile(arg0: IFile): Promise<any> {
		return;
	}

	@Cordova()
	readProfileMessages(arg0: IRoomReading): Promise<any> {
		return;
	}

	@Cordova()
	deleteRoomMessages(arg0: IMessage): Promise<any> {
		return;
	}

	@Cordova()
	readRoomMessages(arg0: IRoomReading): Promise<any> {
		return;
	}

	@Cordova()
	stopReadDbSession(): Promise<any> {
		return;
	}

	@Cordova()
	getProfiles(): Promise<any> {
		return;
	}

	@Cordova()
	getProfile(arg0: IProfile): Promise<any> {
		return;
	}

	@Cordova()
	call(arg0: ICall): Promise<any> {
		return;
	}

	@Cordova({
        observable: true
    })
	onMessage(): Observable<any> {
		return;
	}

	@Cordova({
        observable: true
    })
	onMessageStatus(): Observable<any> {
		return;
	}

	@Cordova({
        observable: true
    })
	onActivity(): Observable<any> {
		return;
	}

	@Cordova({
        observable: true
    })
	onLocation(): Observable<any> {
		return;
	}

	@Cordova({
        observable: true
    })
	onFile(): Observable<any> {
		return;
	}

	@Cordova({
        observable: true
    })
	onUserProfile(): Observable<any> {
		return;
	}
}


export interface IToken {
	token: string;
};

export interface IMessage {
	id?: string;
	peer: string;
	groupId: number;
	message?: string;
	sender?: string;
	type?: number;
};

export interface IFile {
	peer: string;
	groupId: number;
	message?: string;
	sender?: string;
	url?: string;
	type?: string;
	size?: string;
};

export interface IRoomReading {
	address: string;
	messageCount: number;
	groupId: number;
	enableFifo: boolean;
	enableReadReceipt: boolean;
};

export interface IProfile {
	peer: string;
	groupId: number; 
	isGroup: boolean;
};

export interface ICall {
	peer: string; 
	isVideoCall: boolean;
	groupId: number;
};

export interface IActivity {
	peer: string;
	groupId: number;
	activity: number;
	sender?: string;
	roomId?: number;
};