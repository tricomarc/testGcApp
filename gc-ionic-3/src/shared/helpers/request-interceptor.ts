import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { Platform } from 'ionic-angular';
import { includes } from 'lodash';

import * as moment from 'moment';

import { RequestProvider } from '../providers/request/request';
import { SessionProvider } from '../providers/session/session';

import { global } from '../../shared/config/global';
import { globalConfig } from '../../config';

@Injectable()
export class RequestInterceptor implements HttpInterceptor {
    constructor(private request: RequestProvider, private platform: Platform) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        if (globalConfig.isBrowser && includes(request.url, '/errorlog/error')) return EMPTY;

        if (
            request.body
            && this.platform.is('cordova')
            && global.pro.channel === 'Production'
            && !includes(request.url, '/cert/create/log')
        ) {
            this.request.logRequest({
                empresa: global.title,
                endpoint: request.url,
                body: request.body,
                usuario: SessionProvider.state.getValue().userId,
                createdAt: moment().format('DD-MM-YYYY hh:mm:ss')
            }, global.bundle_id, global.MS_URL);
        }
        return next.handle(request);
    }
}