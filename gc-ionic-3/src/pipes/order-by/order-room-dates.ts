import { Pipe, PipeTransform } from '@angular/core';

import * as _ from 'lodash';
import { IRoomDate} from '../../pages/chat/interfaces/room-date.interface';

@Pipe({
    name: 'orderRoomDates',
    pure: false
})
export class OrderRoomDatesPipe implements PipeTransform {
    constructor() { }

    transform(dates: IRoomDate[]) {
        return _.orderBy(dates, ['value'], ['asc']);
    }
}
