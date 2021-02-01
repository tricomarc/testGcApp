import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';

import { RequestProvider } from '../request/request';
import { SessionProvider } from '../session/session';
import { UtilProvider } from '../util/util';

import { MesiboCordova } from '../../custom-plugins/mesibo.plugin';

interface IUpdate {
	name: string;
	type: string;
	progress: number;
};

@Injectable()
export class MesiboProvider {

	constructor(
		private event: Events,
		private mesiboCordova: MesiboCordova,
		private request: RequestProvider,
		private session: SessionProvider,
		private util: UtilProvider) {
	}

	// Solicita al servicio, registrar al usuario actual en Mesibo
	async registerUser(endpoint: string, version: any) {
		let result: any = null;

		await this.request
			.get(endpoint, true)
			.then((response: any) => {
				if(response.data && response.data.token_mesibo) {
					result = response.data.token_mesibo;
				}
			})
			.catch((error: any) => {
				this.util.logError(JSON.stringify(error), 'CMP01', version);
			});
		return result;
	}

	sendActivity(activity: number, peer: string, groupId: number, roomId: number, sender: string) {
		this.mesiboCordova.sendActivity({
			activity: activity,
			peer: peer ? peer : '',
			groupId: groupId ? groupId : 0,
			roomId: roomId ? roomId : 0,
			sender: sender
		})
			.then((act) => { console.log('act', act) })
			.catch((err) => { console.log('err', err) });
	}

	// Busca la sesión del usuario actual y retorna su token de Mesibo
	async getMesiboUserAccessToken() {
		let token: string = null;

		await this.session
			.getSession()
			.then((session: any) => {
				if (
					session
					&& session.usuario
					&& session.usuario.token_mesibo
				) {
					token = session.usuario.token_mesibo;
				}
			});
		return token;
	}

	// Verifica que el usuario tenga un access token de Mesibo si es que tiene el módulo de chat activo
    async checkChatModuleStatus(session: any, version: any) {
        // Si el usuario tiene el módulo de chat
        if (
            session.usuario
            && session.usuario.modulo_chat === true
        ) {
            // Si la sesión no tiene registrado el token de Mesibo
            if (!session.usuario.token_mesibo) {
                // Registramos al usuario
                let token_mesibo: any = await this.registerUser('/usuarios/addUserMesibo', version);
                // Si el registro es exitoso
                if(token_mesibo) {
                    // Actualizamos la sesión y guardamos la nueva sesión
                    session.usuario.token_mesibo = token_mesibo;
                    this.session.saveSession(session);
                }
            }
        }
    }
}