import { Pipe, PipeTransform } from '@angular/core';
import { filter, includes } from 'lodash';

import { Room } from '../../pages/chat/interfaces/room';

@Pipe({
    name: 'roomFilter'
})
export class RoomFilterPipe implements PipeTransform {
    constructor() { }

    transform(rooms: Room[], searchTerm: string) {
        return filter(rooms, (room: Room) => {

            const name = room.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const term = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const message = room.message ? room.message.content.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : null;

            return (includes(name, term) || (message && includes(message, term)));
        });
    }
}
