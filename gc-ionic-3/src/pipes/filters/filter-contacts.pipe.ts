import { Pipe, PipeTransform } from '@angular/core';
import { filter, includes } from 'lodash';

import { User } from '../../pages/chat/interfaces/user';

@Pipe({
    name: 'contactFilter'
})
export class ContactFilterPipe implements PipeTransform {
    constructor() { }

    transform(contacts: User[], searchTerm: string) {
        return filter(contacts, (contact: User) => {
            const name = contact.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const term = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            return includes(name, term);
        });
    }
}
