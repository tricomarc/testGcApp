import { Pipe, PipeTransform } from '@angular/core';

import * as moment from 'moment';

@Pipe({
    name: 'secondsToMinutes',
    pure: false
})
export class SecondsToMinutesPipe implements PipeTransform {
    constructor() { }

    transform(seconds: number) {
        const aux = moment().utcOffset(0);
        aux.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        return aux.add(seconds, 'seconds').format('mm:ss')
    }
}
