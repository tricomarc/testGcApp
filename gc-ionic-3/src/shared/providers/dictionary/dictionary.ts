import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SessionProvider } from '../session/session';
import * as _ from 'lodash';

@Injectable()

export class DictionaryProvider {
	private session: any;

	private diccionario = {
		'Ambito': 'Ámbito',
		'Ambitos': 'Ámbitos',
		'Campaña/Tarea': 'Campaña/Tarea',
		'Checklist': 'Checklist',
		'Checklists': 'Checklists',
		'Ciudad': 'Ciudad',
		'CodigoSucursal': 'CódigoSucursal',
		'Comuna': 'Comuna',
		'Premios': 'Premios',
		'Region': 'Región',
		'Subgerencia': 'Subgerencia',
		'Subgerencias': 'Subgerencias',
		'Sucursal': 'Sucursal',
		'Sucursales': 'Sucursales',
		'Tienda': 'Tienda',
		'Tiendas': 'Tiendas',
		'Zonas': 'Asesor de Estacion'
	}

	constructor(
		private sessionProvider: SessionProvider
	){}

	async getDictionary(){
		await this.sessionProvider.getSession().then((session: any) => {
			this.session = session;
		});

		let dicc = this.session.usuario[ 'diccionario' ];

		if( !_.isEmpty( dicc ) && !_.isNull( dicc ) &&  !_.isUndefined( dicc ) ){
			_.forEach( this.diccionario, ( word: any, deff: any ) => {
				_.forEach( dicc, ( term: any, auxdeff: any ) => {
					//si viene, actualizamos el diccionario con la palabra que viene
					if( deff == auxdeff ){
						// si el valor existe
						if( !_.isNull( term ) &&  !_.isUndefined( term ) ){
							this.diccionario[ `${deff}` ] = term;
						}
					}
					// si no viene queda igual
				} );
			} );
			
			return this.diccionario

		// si no correspone un diccionario o viene vacio o null, se usa el diccionario usual
		}else{
			return this.diccionario;
		}
	}
}
