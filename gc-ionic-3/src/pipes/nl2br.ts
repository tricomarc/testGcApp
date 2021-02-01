import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'nl2br',
})
export class Nl2brPipe implements PipeTransform {

    transform(str: string, isXhtml: boolean) {
        if (!str) return '';
        const breakTag = (isXhtml) ? '<br />' : '<br>'
        return str.replace(/(\r\n|\n\r|\r|\n)/g, breakTag + '$1')
    }
}