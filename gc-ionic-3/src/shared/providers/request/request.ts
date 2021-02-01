import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';

import { SessionProvider } from '../../providers/session/session';
import { global } from '../../config/global';
import { Storage } from "@ionic/storage";
import * as _ from 'lodash';
import { UUID } from 'angular2-uuid';

@Injectable()
export class RequestProvider {
    uuid: string;

    private key: string = '1b1f41fc66a5f0fff99c0e09e4af6705aef93af9';

    constructor(private http: HttpClient,
        private session: SessionProvider,
        private events: Events,
        public storage: Storage
    ) {

        this.storage.get('uuid').then(uuid => {
            this.uuid = uuid;
        }).catch(function (e) { });
    }

    // Genera los headers comunes para las consultas que los requieran
    private buildHeaders() {
        let temp = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
            // 'Client': global.bundle_id
        };
        return this.session
            .getSession()
            .then((session: any) => {
                if (session) {
                    temp['Authorization'] = (session.sessionid + '-' + session.usuario.id + '-' + this.uuid);
                    return new HttpHeaders(temp);
                }
            });
    }

    // Genera los headers comunes para las consultas que los requieran
    private buildHeadersNew() {
        let temp = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        return this.session
            .getSession()
            .then((session: any) => {
                if (session) {
                    temp['Authorization'] = (session.sessionid + '-' + session.usuario.id + '-' + this.uuid);
                    temp['Access-Control-Allow-Headers'] = 'X-Requested-With, Content-Type, Origin, Authorization, Accept, Client-Security-Token, Accept-Encoding';
                    return new HttpHeaders(temp);
                }
            });
    }

    private buildHeadersWithClient(client: string) {
        let temp = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Client': client
        };
        return this.session
            .getSession()
            .then((session: any) => {
                if (session) {
                    temp['Authorization'] = (session.sessionid + '-' + session.usuario.id + '-' + this.uuid);
                    temp['Access-Control-Allow-Headers'] = 'X-Requested-With, Content-Type, Origin, Authorization, Accept, Client-Security-Token, Accept-Encoding';
                    return new HttpHeaders(temp);
                }
            });
    }

    getLocal(endpoint: string, isNew: boolean) {
        return new Promise((resolve, reject) => {
            this.buildHeaders().
                then((headers: HttpHeaders) => {
                    this.http.get(global.API_LOCAL + endpoint, { 
                        headers: {
                            'Content-Type': 'application/json', 
                            'Accept': 'application/json', 
                            'Client': 'cl.gcogas.gcapp',
                            'Authorization': '1deeb7a65f15847153915283d308761b2acea8bb-34-null' } 
                        })
                        .toPromise()
                        .then(result => {
                            resolve(result)
                        })
                })
                .catch((e) => {
                    reject(e)
                });
        })
    }

    // Get general, recibe el endpoint y retorna una promesa
    get(endpoint: string, isNew: boolean) {
        return new Promise((resolve, reject) => {
            this.buildHeaders()
                .then((headers: HttpHeaders) => {
                    this.http
                        .get(((isNew ? global.API_NEW : global.API_OLD) + endpoint), { headers: headers })
                        .timeout(60000)
                        .toPromise()
                        .then((result: any) => {
                            this.checkStatusCode(result);
                            try {
                                if (result && (result.entriptado || result.encriptado)) {
                                    resolve(JSON.parse(this.decrypt(result.response.replace(/'/g, ''), this.key)));
                                    return;
                                }
                                resolve(result);
                            } catch (e) {
                                reject(e);
                            }
                        })
                        .catch((error: any) => {
                            let formatError = JSON.stringify(error) + "";
                            formatError = JSON.parse(formatError);
                            if (formatError['name'] && formatError['name'] == "TimeoutError") {
                                reject({ message: global.dictionary.timeout });
                            }
                            else if (error.status === 0) reject({ message: global.dictionary.timeout });
                            else if (error.status === 404) reject({ message: global.dictionary.notFound });
                            else reject({ message: global.dictionary.default });
                        });
                })
                .catch((error: any) => {
                    reject(null);
                })
        });
    }

    getMicroService(endpoint: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.buildHeadersWithClient(global.bundle_id)
                .then((headers: HttpHeaders) => {
                    this.http
                        .get((global.API_AWS + endpoint), { headers: headers })
                        .timeout(60000)
                        .toPromise()
                        .then((result: any) => {
                            try {
                                resolve(result);
                            } catch (e) {
                                reject(e);
                            }
                        })
                        .catch((error: any) => {
                            let formatError = JSON.stringify(error) + "";
                            formatError = JSON.parse(formatError);
                            if (formatError['name'] && formatError['name'] == "TimeoutError") {
                                reject({ message: global.dictionary.timeout });
                            }
                            else if (error.status === 0) reject({ message: global.dictionary.timeout });
                            else if (error.status === 404) reject({ message: global.dictionary.notFound });
                            else reject({ message: global.dictionary.default });
                        });
                })
                .catch((error: any) => {
                    reject(null);
                })
        });
    }

    // Get general, recibe el endpoint y retorna una promesa
    getWithoutHeaders(endpoint: string) {
        return new Promise((resolve, reject) => {
            this.http
                .get((global.API_NEW + endpoint), {})
                .timeout(30000)
                .toPromise()
                .then((result: any) => {
                    this.checkStatusCode(result);
                    try {
                        if (result && (result.entriptado || result.encriptado)) {
                            resolve(JSON.parse(this.decrypt(result.response.replace(/'/g, ''), this.key)));
                            return;
                        }
                        resolve(result);
                    } catch (e) {
                        reject(e);
                    }
                })
                .catch((error: any) => {
                    let formatError = JSON.stringify(error) + "";
                    formatError = JSON.parse(formatError);
                    if (formatError['name'] && formatError['name'] == "TimeoutError") {
                        reject({ message: global.dictionary.timeout });
                    }
                    else if (error.status === 0) reject({ message: global.dictionary.timeout });
                    else if (error.status === 404) reject({ message: global.dictionary.notFound });
                    else reject({ message: global.dictionary.default });
                });
        });
    }

    // Post general, recibe el endpoint y retorna una promesa
    post(endpoint: string, data: any, isNew: boolean) {
        return new Promise((resolve, reject) => {
            this.buildHeaders()
                .then((headers: HttpHeaders) => {
                    this.http
                        .post(((isNew ? global.API_NEW : global.API_OLD) + endpoint), data, { headers: headers })
                        .timeout(60000)
                        .toPromise()
                        .then((result: any) => {
                            try {
                                this.checkStatusCode(result);
                                if (result && (result.entriptado || result.encriptado)) {
                                    resolve(JSON.parse(this.decrypt(result.response.replace(/'/g, ''), this.key)));
                                    return;
                                }
                                resolve(result);
                            } catch (e) {
                                reject(e);
                            }
                        })
                        .catch((error: any) => {
                            let formatError = JSON.stringify(error) + "";
                            formatError = JSON.parse(formatError);
                            if (formatError['name'] && formatError['name'] == "TimeoutError") reject({ message: global.dictionary.timeout });
                            else if (error.status === 0) reject({ message: global.dictionary.timeout });
                            else if (error.status === 404) reject({ message: global.dictionary.notFound });
                            else reject({ message: global.dictionary.default });
                        });
                })
                .catch((error: any) => {
                    reject(error);
                })
        });
    }

    postMicroService(endpoint: string, data: any) {
        return new Promise((resolve, reject) => {
            this.buildHeadersWithClient(global.bundle_id)
                .then((headers: HttpHeaders) => {
                    this.http
                        .post((global.API_AWS + endpoint), data, { headers: headers })
                        .timeout(60000)
                        .toPromise()
                        .then((result: any) => {
                            try {
                                resolve(result);
                            } catch (e) {
                                reject(e);
                            }
                        })
                        .catch((error: any) => {
                            let formatError = JSON.stringify(error) + "";
                            formatError = JSON.parse(formatError);
                            if (formatError['name'] && formatError['name'] == "TimeoutError") reject({ message: global.dictionary.timeout });
                            else if (error.status === 0) reject({ message: global.dictionary.timeout });
                            else if (error.status === 404) reject({ message: global.dictionary.notFound });
                            else reject({ message: global.dictionary.default });
                        });
                })
                .catch((error: any) => {
                    reject(error);
                })
        });
    }

    patchAWS(endpoint: string, data: any) {
        return new Promise((resolve, reject) => {
            this.buildHeadersWithClient(global.bundle_id)
                .then((headers: HttpHeaders) => {
                    this.http
                        .patch((global.API_AWS + endpoint), data, { headers: headers })
                        .timeout(60000)
                        .toPromise()
                        .then((result: any) => {
                            try {
                                resolve(result);
                            } catch (e) {
                                reject(e);
                            }
                        })
                        .catch((error: any) => {
                            let formatError = JSON.stringify(error) + "";
                            formatError = JSON.parse(formatError);
                            if (formatError['name'] && formatError['name'] == "TimeoutError") reject({ message: global.dictionary.timeout });
                            else if (error.status === 0) reject({ message: global.dictionary.timeout });
                            else if (error.status === 404) reject({ message: global.dictionary.notFound });
                            else reject({ message: global.dictionary.default });
                        });
                })
                .catch((error: any) => {
                    reject(error);
                })
        });
    }

    
    // postAWS(endpoint: string, data: any){
    //     return new Promise( async (resolve, reject) => {
    //         if(!global.API_AWS) return { status: false, message: 'Api no implementada' };
    
    //         let temp = {
    //             'Content-Type': 'application/json',
    //             'Accept': 'application/json',
    //             'Client': global.bundle_id
    //         };

    //         this.http.post(global.API_AWS + endpoint, data, { headers: temp })
    //             .timeout(60000).toPromise()
    //             .then((result) => {
    //                 return resolve(result);
    //             })
    //             .catch((error: any) => {
    //                 let formatError = JSON.stringify(error) + "";
    //                 formatError = JSON.parse(formatError);
    //                 if (formatError['name'] && formatError['name'] == "TimeoutError") reject({ message: global.dictionary.timeout });
    //                 else if (error.status === 0) reject({ message: global.dictionary.timeout });
    //                 else if (error.status === 404) reject({ message: global.dictionary.notFound });
    //                 else reject({ message: global.dictionary.default });
    //             });
    
    //     })
    // }
    
    // getAWS(endpoint: string, queryParams?: any){
    //     return new Promise( async (resolve, reject) => {
    //         if(!global.API_AWS) return { status: false, message: 'Api no implementada' };
    
    //         let headers: HttpHeaders = await this.buildHeadersWithClient(global.bundle_id);
    //         this.http.get(global.API_AWS + endpoint , { headers: headers })
    //             .timeout(30000).toPromise()
    //             .then((result) => {
    //                 return resolve(result);
    //             })
    //             .catch((error: any) => {
    //                 let formatError = JSON.stringify(error) + "";
    //                 formatError = JSON.parse(formatError);
    //                 if (formatError['name'] && formatError['name'] == "TimeoutError") reject({ message: global.dictionary.timeout });
    //                 else if (error.status === 0) reject({ message: global.dictionary.timeout });
    //                 else if (error.status === 404) reject({ message: global.dictionary.notFound });
    //                 else reject({ message: global.dictionary.default });
    //             });
    
    //     })
    // }
    


    // Post con timeout custom, recibe el endpoint y retorna una promesa
    postWithTimeout(endpoint: string, data: any, isNew: boolean, timeout: number) {
        return new Promise((resolve, reject) => {
            this.buildHeaders()
                .then((headers: HttpHeaders) => {
                    this.http
                        .post(((isNew ? global.API_NEW : global.API_OLD) + endpoint), data, { headers: headers })
                        .timeout(timeout)
                        .toPromise()
                        .then((result: any) => {
                            try {
                                this.checkStatusCode(result);
                                if (result && (result.entriptado || result.encriptado)) {
                                    resolve(JSON.parse(this.decrypt(result.response.replace(/'/g, ''), this.key)));
                                    return;
                                }
                                resolve(result);
                            } catch (e) {
                                reject(e);
                            }
                        })
                        .catch((error: any) => {
                            let formatError = JSON.stringify(error) + "";
                            formatError = JSON.parse(formatError);
                            if (formatError['name'] && formatError['name'] == "TimeoutError") reject({ message: global.dictionary.timeout });
                            else if (error.status === 0) reject({ message: global.dictionary.timeout });
                            else if (error.status === 404) reject({ message: global.dictionary.notFound });
                            else reject({ message: global.dictionary.default });
                        });
                })
                .catch((error: any) => {
                    reject(error);
                })
        });
    }

    // Delete general, recibe el endpoint y retorna una promesa
    delete(endpoint: string, isNew: boolean) {
        return new Promise((resolve, reject) => {
            this.buildHeaders()
                .then((headers: HttpHeaders) => {
                    this.http
                        .delete(((isNew ? global.API_NEW : global.API_OLD) + endpoint), { headers: headers })
                        .timeout(30000)
                        .toPromise()
                        .then((result: any) => {
                            try {
                                this.checkStatusCode(result);
                                if (result && (result.entriptado || result.encriptado)) {
                                    resolve(JSON.parse(this.decrypt(result.response.replace(/'/g, ''), this.key)));
                                    return;
                                }
                                resolve(result);
                            } catch (e) {
                                reject(e);
                            }
                        })
                        .catch((error: any) => {
                            let formatError = JSON.stringify(error) + "";
                            formatError = JSON.parse(formatError);
                            if (formatError['name'] && formatError['name'] == "TimeoutError") reject({ message: global.dictionary.timeout });
                            else if (error.status === 0) reject({ message: global.dictionary.timeout });
                            else if (error.status === 404) reject({ message: global.dictionary.notFound });
                            else reject({ message: global.dictionary.default });
                        });
                })
                .catch((error: any) => {
                    reject(error);
                })
        });
    }

    // Patch general, recibe el endpoint y retorna una promesa
    patch(endpoint: string, data: any, isNew: boolean) {
        return new Promise((resolve, reject) => {
            this.buildHeaders()
                .then((headers: HttpHeaders) => {
                    this.http
                        .patch(((isNew ? global.API_NEW : global.API_OLD) + endpoint), data, { headers: headers })
                        .timeout(30000)
                        .toPromise()
                        .then((result: any) => {
                            try {
                                this.checkStatusCode(result);
                                if (result && (result.entriptado || result.encriptado)) {
                                    resolve(JSON.parse(this.decrypt(result.response.replace(/'/g, ''), this.key)));
                                    return;
                                }
                                resolve(result);
                            } catch (e) {
                                reject(e);
                            }
                        })
                        .catch((error: any) => {
                            let formatError = JSON.stringify(error) + "";
                            formatError = JSON.parse(formatError);
                            if (formatError['name'] && formatError['name'] == "TimeoutError") reject({ message: global.dictionary.timeout });
                            else if (error.status === 0) reject({ message: global.dictionary.timeout });
                            else if (error.status === 404) reject({ message: global.dictionary.notFound });
                            else reject({ message: global.dictionary.default });
                        });
                })
                .catch((error: any) => {
                    reject(error);
                })
        });
    }

    // Put general, recibe el endpoint y retorna una promesa
    put(endpoint: string, data: any, isNew: boolean) {
        return new Promise((resolve, reject) => {
            this.buildHeaders()
                .then((headers: HttpHeaders) => {
                    let url = ((isNew ? global.API_NEW : global.API_OLD) + endpoint);
                    this.http
                        .put(url, data, { headers: headers })
                        .timeout(30000)
                        .toPromise()
                        .then((result: any) => {
                            try {
                                this.checkStatusCode(result);
                                if (result && (result.entriptado || result.encriptado)) {
                                    resolve(JSON.parse(this.decrypt(result.response.replace(/'/g, ''), this.key)));
                                    return;
                                }
                                resolve(result);
                            } catch (e) {
                                reject(e);
                            }
                        })
                        .catch((error: any) => {
                            let formatError = JSON.stringify(error) + "";
                            formatError = JSON.parse(formatError);
                            if (formatError['name'] && formatError['name'] == "TimeoutError") reject({ message: global.dictionary.timeout });
                            else if (error.status === 0) reject({ message: global.dictionary.timeout });
                            else if (error.status === 404) reject({ message: global.dictionary.notFound });
                            else reject({ message: global.dictionary.default });
                        });
                })
                .catch((error: any) => {
                    reject(error);
                })
        });
    }

    // Solicita la validación de las credenciales
    login(endpoint: string, data: any) {
        return new Promise((resolve, reject) => {
            this.http
                .post((global.API_NEW + endpoint), data)
                .timeout(30000)
                .subscribe((response: any) => {
                    var responseLogin = response;
                    if (!_.isUndefined(responseLogin) && !_.isNull(responseLogin)) {

                        //Si el retorno viene encriptado, se debe desencriptar
                        if (!_.isUndefined(responseLogin.entriptado) && !_.isNull(responseLogin.entriptado)) {
                            if (responseLogin.entriptado == true) {
                                responseLogin = JSON.parse(this.decrypt(response.response.replace(/'/g, ''), '1b1f41fc66a5f0fff99c0e09e4af6705aef93af9'))
                            }
                        } else if (!_.isUndefined(responseLogin.encriptado) && !_.isNull(responseLogin.encriptado)) {
                            if (responseLogin.encriptado == true) {
                                responseLogin = JSON.parse(this.decrypt(response.response.replace(/'/g, ''), '1b1f41fc66a5f0fff99c0e09e4af6705aef93af9'));
                            }
                        }
                    }

                    if (responseLogin.code == 403 && responseLogin.message == "") {
                        responseLogin.message = "Por su seguridad su cuenta se ha bloqueado por 30 minutos.";
                    }
                    resolve(responseLogin);
                }, (error) => {

                    if (!error && !error.error && !_.isUndefined(error.error) && !_.isUndefined(error.error.text)) {
                        var errorText = error.error.text;
                        var splittedTop = errorText.split("[message] => ");
                        var splittedBottom = splittedTop[1].split(" [success] =>");
                        var passError = {
                            code: 403,
                            message: splittedBottom[0]
                        }
                        reject(passError);
                    } else {

                        let formatError = JSON.stringify(error) + "";
                        formatError = JSON.parse(formatError);
                        if (formatError['name'] && formatError['name'] == "TimeoutError") reject({ message: global.dictionary.timeout });
                        else if (error.status === 0) reject({ message: global.dictionary.timeout });
                        else if (error.status === 404) reject({ message: global.dictionary.notFound });
                        else reject({ message: global.dictionary.default });

                        /*  if (error.status == 0) {
                              error.message = "No hemos podido establecer conexión con el servidor.";
                          } else if (error.status == 403) {
                              error.message = "Por su seguridad su cuenta se ha bloqueado por 30 minutos.";
                          } else if (error.status === 404) {
                              error.message = "No hemos encontrado respuesta para su solicitud.";
                          }
                          reject(error);*/
                    }
                });
        });
    }

    logout(sessionid: any, type: any) {
        return new Promise((resolve, reject) => {
            this.buildHeaders()
                .then((headers: HttpHeaders) => {
                    this.http
                        .post(`${global.API_OLD}/usuarios/cerrarsesion`, {
                            sessionid: sessionid,
                            tipo: type,
                            uuid: 'local'
                        }, { headers: headers })
                        .timeout(15000)
                        .subscribe((response: any) => {
                            if (response && response.status) {
                                resolve(true);
                                return;
                            }
                            reject();
                        }, (error: any) => {
                            reject();
                        });
                });
        })
    }

    recoveryPassword(endpoint: string, data: any) {
        return new Promise((resolve, reject) => {
            this.http
                .post((global.API_NEW + endpoint), data)
                .timeout(15000)
                .subscribe((response: any) => {
                    resolve(response);
                }, (error) => {
                    let formatError = JSON.stringify(error) + "";
                    formatError = JSON.parse(formatError);
                    if (formatError['name'] && formatError['name'] == "TimeoutError") reject({ message: global.dictionary.timeout });
                    else if (error.status === 0) reject({ message: global.dictionary.timeout });
                    else if (error.status === 404) reject({ message: global.dictionary.notFound });
                    else reject({ message: global.dictionary.default });
                });
        });
    }

    recoverPasswordMicroService(endpoint: string, data: any) {
        return new Promise((resolve, reject) => {
            const headers = { Client: global.bundle_id }
            this.http
                .post((global.API_AWS + endpoint), data, { headers: headers })
                .timeout(15000)
                .subscribe((response: any) => {
                    resolve(response);
                }, (error) => {
                    let formatError = JSON.stringify(error) + "";
                    formatError = JSON.parse(formatError);
                    if (formatError['name'] && formatError['name'] == "TimeoutError") reject({ message: global.dictionary.timeout });
                    else if (error.status === 0) reject({ message: global.dictionary.timeout });
                    else if (error.status === 404) reject({ message: global.dictionary.notFound });
                    else reject({ message: global.dictionary.default });
                });
        });
    }

    getClientStandards(endpoint: string) {
        return new Promise((resolve, reject) => {
            this.http
                .get((global.API_NEW + endpoint))
                .timeout(15000)
                .subscribe((response: any) => {
                    resolve(response);
                }, (error) => {
                    let formatError = JSON.stringify(error) + "";
                    formatError = JSON.parse(formatError);
                    if (formatError['name'] && formatError['name'] == "TimeoutError") reject({ message: global.dictionary.timeout });
                    else if (error.status === 0) reject({ message: global.dictionary.timeout });
                    else if (error.status === 404) reject({ message: global.dictionary.notFound });
                    else reject({ message: global.dictionary.default });
                });
        });
    }



    // Verifica si el código de la respuesta de la API es un 403 o 401 y si debe o no activar el evento que caduca la sesión
    isUnauthorized(code: any, activateEvent: boolean) {
        if (code === 401 || code === 403) {
            if (activateEvent) this.events.publish('expiredSession');
            return true;
        }
        return false;
    }

    decrypt(sData, sKey) {
        var sResult = "";
        sData = this.decode64(sData);

        var i = 0;
        for (i = 0; i < sData.length; i++) {
            var sChar = sData.substr(i, 1);
            var sKeyChar = sKey.substr(i % sKey.length - 1, 1);
            sChar = Math.floor(this.ord(sChar) - this.ord(sKeyChar));
            sChar = String.fromCharCode(sChar);
            sResult = sResult + sChar;
        }
        return sResult;
    }

    decode64(text) {

        text = text.replace(/\s/g, "");
        text = text.replace(/-/g, '+');
        text = text.replace(/_/g, '/');

        if (!(/^[a-z0-9\+\/\s]+\={0,2}$/i.test(text)) || text.length % 4 > 0) {
            throw new Error("Not a base64-encoded string.");
        }
        var digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
            cur, prev, digitNum, i = 0,
            result = [];

        text = text.replace(/=/g, "");

        while (i < text.length) {

            cur = digits.indexOf(text.charAt(i));
            digitNum = i % 4;

            switch (digitNum) {

                //case 0: first digit - do nothing, not enough info to work with
                case 1:
                    //second digit
                    result.push(String.fromCharCode(prev << 2 | cur >> 4));
                    break;

                case 2:
                    //third digit
                    result.push(String.fromCharCode((prev & 0x0f) << 4 | cur >> 2));
                    break;

                case 3:
                    //fourth digit
                    result.push(String.fromCharCode((prev & 3) << 6 | cur));
                    break;
            }

            prev = cur;
            i++;
        }

        return result.join("");
    }

    ord(string) {

        var str = string + '',
            code = str.charCodeAt(0);
        if (0xD800 <= code && code <= 0xDBFF) {
            var hi = code;
            if (str.length === 1) {
                return code;
            }
            var low = str.charCodeAt(1);
            return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
        }
        if (0xDC00 <= code && code <= 0xDFFF) {
            return code;
        }
        return code;
    }

    // Si el status code es 403 o 401, cierra la sesión
    checkStatusCode(result: any) {
        if (result && result.code && (result.code === 403 || result.code === '403') && (_.includes(result.message.toLowerCase(), 'acceso prohibido'))) {
            this.events.publish('expired_session');
        }
    }

    mesiboRequest(url: string) {
        return this.http.get(url).toPromise();
    }

    /* async saveLocally(data: any, client: string, url: string) {
        const errors: any[] = await this.getErrorStore();
        const error: any = _.find(errors, e => JSON.stringify(e.data) === JSON.stringify(data));
        if (error) return;
        errors.push({ data: data, client: client, url: url });
        this.storage.set('LOG_REQUEST_ERROR_STORE', JSON.stringify(errors));
    }

    async getErrorStore(): Promise<any[]> {
        return await this.storage.get('LOG_REQUEST_ERROR_STORE').then((res) => (JSON.parse(res) || [])).catch(err => []);
    }

    async sendErrorStore() {
        const errors: any[] = await this.getErrorStore();
        _.forEach(errors, e => {
            const err = JSON.parse(e);
            this.logRequest(err.data, err.client, err.url, true);
        });
    } */

    logRequest(data: any, client: string, url: string, notSave?: boolean) {
        this.buildHeadersWithClient(client)
            .then((headers: HttpHeaders) => {
                this.http.post(url, data, { headers: headers })
                    .toPromise().then(() => { }).catch(() => {
                        if (!notSave) this.saveLocally(data, client, url);
                    });
            });
    }

    async saveLocally(data: any, client: string, url: string) {
        const errors: any[] = await this.getLogRequestErrors();
        errors.push({ data: data, client: client, url: url });
        this.storage.set('LOG_REQUEST_ERROR_STORE', JSON.stringify(errors)).then(() => { }).catch(() => { });
    }

    async getLogRequestErrors(): Promise<any[]> {
        return await this.storage.get('LOG_REQUEST_ERROR_STORE').then((res) => (JSON.parse(res) || [])).catch(err => []);
    }

    async sendBulkLogRequestErrors() {
        const errors: any[] = await this.getLogRequestErrors();
        const promises = [];

        if (!errors.length) return;

        await this.buildHeadersWithClient(errors[0].client)
            .then((headers: HttpHeaders) => {
                _.forEach(errors, (err: any) => {
                    promises.push(new Promise((resolve) => {
                        this.http.post(err.url, err.data, { headers: headers })
                            .toPromise()
                            .then((response: any) => { resolve({ success: true, data: err.data }) })
                            .catch((apiError: any) => { resolve({ success: false, data: err.data }) });
                    }));
                });
            });

        Promise.all(promises)
            .then(async (results: any[]) => {
                _.forEach(results, (res: any) => {
                    if (res.success) {
                        _.remove(errors, (err) => {
                            return (JSON.stringify(err.data) === JSON.stringify(res.data));
                        });
                    }
                });
                this.storage.set('LOG_REQUEST_ERROR_STORE', JSON.stringify(errors));
            });
    }
}
