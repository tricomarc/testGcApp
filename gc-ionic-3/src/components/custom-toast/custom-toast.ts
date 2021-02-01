import { Component, Input, Output, ViewChild } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Content, Events } from 'ionic-angular';

@Component({
    selector: 'custom-toast',
    templateUrl: 'custom-toast.html'
})
export class CustomToast {

    @ViewChild(Content) content: Content;

    public static title: string = '';
    public static text: string = '';
    public static image: string = '';
    public static component: any = null;
    public static params: any = null;

    constructor(private events: Events) { }

    destroy() {
        if (CustomToast.component) CustomToast.component.destroy();
    }

    openRoom() {
        this.events.publish('show-room-from-toast', { params: CustomToast.params });
        if (CustomToast.component) CustomToast.component.destroy();
    }

    get data() {
        return {
            title: CustomToast.title,
            text: CustomToast.text,
            image: CustomToast.image,
            params: CustomToast.params
        }
    }
}