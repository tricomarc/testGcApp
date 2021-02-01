import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Media, MediaObject } from '@ionic-native/media';
import { File, FileEntry } from '@ionic-native/file';
import { Platform } from 'ionic-angular';
import { interval } from 'rxjs';

import  * as moment from 'moment';

import { UtilProvider } from '../../../../shared/providers/util/util';
import { globalConfig } from '../../../../config';

@Component({
    selector: 'audio-recorder',
    templateUrl: 'audio-recorder.html'
})

export class AudioRecorderComponent implements OnInit, OnDestroy {

    @Input() maxAudioDuration: number;
    @Input() onRecord: EventEmitter<any>;
    @Output() onCancelRecord = new EventEmitter<any>();
    @Output() onSendRecord = new EventEmitter<string>();

    private audio: MediaObject = null;
    private path: string = null;
    private duration = {
        currentDuration: 0,
        maxAudioDuration: this.maxAudioDuration,
        maxAudioDurationString: '00:00',
        interval: null
    };

    constructor(private util: UtilProvider, private media: Media, private file: File, private platform: Platform) { }

    ngOnInit(): void {
        this.duration.maxAudioDurationString = this.getMaxAudioDurationString();
        this.onRecord.subscribe(() => {
            this.resetValues();
            this.recordAudio();
        });
    }

    ngOnDestroy(): void {
        this.onRecord.unsubscribe();
        this.resetValues();
    }

    cancelRecord() {
        this.onCancelRecord.next(null);
        this.clearDurationInterval();
        this.audio.stopRecord();
        this.audio.release();
    }

    sendRecord() {
        if(this.duration.currentDuration > 0) {
            this.clearDurationInterval();
            this.audio.stopRecord();
            this.audio.release();
            this.onSendRecord.next(this.path);
            return;
        }
        this.cancelRecord();
    }

    recordAudio() {
        const mediaPath: string = (this.platform.is('ios') ? this.file.tempDirectory : this.file.externalDataDirectory);

        this.file.createFile(mediaPath, 'audio.m4a', true).then((aux: FileEntry) => {
            this.audio = this.media.create(this.platform.is('ios') ? aux.nativeURL.replace(/^file:\/\//, '') : aux.nativeURL);
            this.path = aux.nativeURL;
            this.audio.startRecord();

            this.duration.interval = interval(1000).subscribe(() => {
                this.duration.currentDuration++;
                if (this.duration.currentDuration >= this.maxAudioDuration) {
                    this.sendRecord();
                }
            });
        }).catch((e) => {
            try { this.util.logError(JSON.stringify(e), null, globalConfig.version); } catch (e) { }
            this.util.showToast('Nota de voz no disponible.', 3000);
            this.sendRecord();
            this.resetValues();
        });
    }

    resetValues() {
        try {
            this.duration.currentDuration = 0;
            this.clearDurationInterval();
            this.audio.release();
        } catch (e) { }

        this.audio = null;
        this.path = null;
    }

    clearDurationInterval() {
        if (this.duration.interval) {
            this.duration.interval.unsubscribe();
            this.duration.interval = null;
        }
    }

    getMaxAudioDurationString() {
        const aux = moment().utcOffset(0);
        aux.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        return aux.add(this.maxAudioDuration, 'seconds').format('mm:ss')
    }
}