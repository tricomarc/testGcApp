import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NavController } from 'ionic-angular';

import { RoomComponent } from '../room/room';
import { Room } from '../../interfaces/room';
import { ChatPage } from '../../chat';

@Component({
	selector: 'room-item',
	templateUrl: 'room-item.html'
})

export class RoomItemComponent {

	@Input() room: Room;
	@Input() os: string;
	@Input() rooms: any;
	@Output() onDelete: any = new EventEmitter<any>();

	private preview: string = null;

	constructor(private navCtrl: NavController) { }

	openRoomDetail() {
		this.navCtrl.push(RoomComponent, { room: this.room, rooms: this.rooms, schedule: ChatPage.schedule }, { animate: false });
	}

	deleteRoom() {
		this.onDelete.next(this.room);
	}
}