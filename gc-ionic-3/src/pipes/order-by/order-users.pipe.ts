import { Pipe, PipeTransform } from '@angular/core';
import { orderBy } from 'lodash';

import { User } from '../../pages/chat/interfaces/user';

@Pipe({
    name: 'orderUsers'
})
export class OrderUsersPipe implements PipeTransform {
    constructor() { }

    transform(users: User[]) {
        return orderBy(users, 'name', ['asc']);
    }
}
