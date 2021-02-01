import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';


@Injectable()
export class LocalizaProvider {

	private localizaUrl = 'http://plataforma.localizagps.cl:7779/';

	constructor(public http: HttpClient) {
		console.log('Hello LocalizaProvider Provider');
	}


	getLastposition( data:any ){
		return new Promise( ( resolve, reject ) => {
			// posible errror
			let headers = new HttpHeaders( {
				// 'text/html'
				'Content-Type': 'text/html',
				'Accept': 'text/html'
			} );

			//servicio post
			this.http.post( this.localizaUrl + "getlastposition", data, { headers: headers, responseType: 'text' } )
				.subscribe( res => {
					resolve( res );
				}, ( err ) => {
					reject( err );
				} 
			);
		} );
	}
}
/*Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Origin: *
Allow: POST
Connection: keep-alive
Content-Length: 4
Content-Type: text/html; charset=utf-8
Date: Fri, 08 Nov 2019 17:54:37 GMT
ETag: W/"4-Yf+Bwwqjx254r+pisuO9HfpJ6FQ"
X-Powered-By: Express


access-control-allow-headers: Origin, X-Requested-With, Content-Type, Accept,Authorization
access-control-allow-methods: PUT, POST, GET
access-control-allow-origin: *
content-type: application/json; charset=utf-8
date: Fri, 08 Nov 2019 17:57:50 GMT
server: nginx
status: 200
x-powered-by: PHP/5.5.9-1ubuntu4.29*/