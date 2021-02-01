import { Pipe, PipeTransform } from '@angular/core';

import * as _ from 'lodash';
import * as moment from 'moment';
import { Room } from '../../pages/chat/interfaces/room';

@Pipe({
	name: 'orderRooms',
	pure: false
})
export class OrderRoomsPipe implements PipeTransform {
	constructor() { }

	transform(rooms: Room[]) {
		return _.orderBy(rooms, (room: Room) => {
			let time: number = room.createdAt;
			if (room.message && room.message.time) {
				time = room.message.time;
			}
			if(isNaN(time)) time = 0;
			return time;
		}, ['desc']);
	}
}
