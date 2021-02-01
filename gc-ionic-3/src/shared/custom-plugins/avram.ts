import { Injectable } from '@angular/core';
import { Plugin, Cordova } from '@ionic-native/core';

@Plugin({
    pluginName: 'cordova-plugin-avram',
    plugin: 'cordova-plugin-avram',
    pluginRef: 'Avram',
    repo: 'https://git.andain.cl/ffuentes/cordova-plugin-avram-andain.git',
    platforms: ['Android']
})

@Injectable()
export class Avram {

    constructor() { }

    @Cordova()
    getAvailableRAM(): Promise<any> {
        return;
    }
}