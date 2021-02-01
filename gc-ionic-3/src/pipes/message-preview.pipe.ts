import { Pipe, PipeTransform } from '@angular/core';

import { Message } from '../pages/chat/interfaces/message';
import { File } from '../pages/chat/interfaces/file';

@Pipe({
    name: 'messagePreview',
    pure: false
})
export class MessagePreviewPipe implements PipeTransform {
    constructor() { }

    transform(message: Message) {
        if (!message || !message.id) return '<em>Chat vacío</em>';

        if(message.type === 1) {
            return message.content;
        }

        if(message.type === 2) {
            const showAs: string = File.getShowAs(message.file.type);
            if(showAs === 'image') return 'Imagen adjunta';
            if (showAs === 'video') return 'Video adjunto';
            if (showAs === 'audio') return 'Audio adjunto';
            return 'Archivo adjunto';
        }
    }
}
