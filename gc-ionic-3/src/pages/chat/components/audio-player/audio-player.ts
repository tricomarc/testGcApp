import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Media, MediaObject } from '@ionic-native/media';
import { File, FileEntry } from '@ionic-native/file';
import { Platform } from 'ionic-angular';
import { interval } from 'rxjs';
import { Howl, Howler } from 'howler';

import * as moment from 'moment';

import { Message } from '../../interfaces/message';
import { UtilProvider } from '../../../../shared/providers/util/util';

@Component({
    selector: 'audio-player',
    templateUrl: 'audio-player.html'
})

export class AudioPlayerComponent implements OnInit {

    @Input() message: Message;
    @Input() position: string;
    @Input() isGroup: boolean;

    private track: ITrack = null;
    private player: any = null;

    private data = {
        loadError: false,
        isPlaying: false,
        duration: 0,
        secProgress: 0,
        progress: 0,
        inteval: null
    };

    constructor(
        private util: UtilProvider,
        private media: Media,
        private file: File,
        private platform: Platform) { }

    ngOnInit(): void {
        this.track = {
            src: this.message.file.url,
            onload: () => {
                console.log('onload');
                this.player.play();
                this.data.duration = this.player.duration();
            },
            onloaderror: () => {
                console.log('onloaderror');
                this.data.loadError = true;
            },
            onplay: () => {
                console.log('onplay');
                this.data.isPlaying = true;
                this.data.inteval = interval(1000).subscribe(() => {
                    this.data.secProgress++;
                    this.data.progress = Math.round((this.data.secProgress * 100) / this.data.duration);
                });
            },
            onend: () => {
                console.log('onend');
                this.data.isPlaying = false;
                this.data.duration = 0;
                this.data.secProgress = 0;
                this.data.progress = 0;
                if (this.data.inteval) {
                    try { this.data.inteval.unsubscribe() } catch (e) { }
                }
            },
            preload: false
        };

        if (!this.track.src) {
            this.data.loadError = true;
            return;
        }

        this.player = new Howl(this.track);
    }

    play() {
        this.player.load();
    }

    pause() {
        this.player.pause();
    }

    seek() {
        const seconds = Math.round((this.data.progress * this.data.duration) / 100);
        this.data.secProgress = seconds;
        this.player.seek(seconds);
    }
}

export interface ITrack {
    src: string;
    preload: boolean;
    onload: any;
    onplay: any;
    onend: any;
    onloaderror: any;
}