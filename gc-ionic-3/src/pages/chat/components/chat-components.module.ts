
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule } from "ionic-angular";
import { IonicImageViewerModule } from 'ionic-img-viewer';
import { LongPressModule } from 'ionic-long-press';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { VgCoreModule } from 'videogular2/core';
import { VgControlsModule } from 'videogular2/controls';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { VgBufferingModule } from 'videogular2/buffering';

import { RoomItemComponent } from './room-item/room-item';
import { RoomComponent } from './room/room';
import { NewChatComponent } from './new-chat/new-chat';
import { GroupSetupComponent } from './group-setup/group-setup';
import { ContactBubbleComponent } from './contact-bubble/contact-bubble';
import { PopoverMessageComponent } from './popover-message/popover-message';
import { RoomInfoComponent } from './room-info/room-info';
import { MessageDetailComponent } from './message-detail/message-detail';
import { AudioRecorderComponent } from './audio-recorder/audio-recorder';
import { AudioPlayerComponent } from './audio-player/audio-player';
import { CallHistoryComponent } from './call-history/call-history';

import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
	declarations: [
		RoomItemComponent,
		RoomComponent,
		NewChatComponent,
		GroupSetupComponent,
		ContactBubbleComponent,
		PopoverMessageComponent,
		RoomInfoComponent,
		MessageDetailComponent,
		AudioRecorderComponent,
		AudioPlayerComponent,
		CallHistoryComponent
	],
	imports: [
		IonicModule,
		PipesModule,
		LongPressModule,
		IonicImageViewerModule,
		LazyLoadImageModule,
		RoundProgressModule,
		VgCoreModule,
		VgControlsModule,
		VgOverlayPlayModule,
		VgBufferingModule
	],
	exports: [
		RoomItemComponent,
		RoomComponent,
		NewChatComponent,
		GroupSetupComponent,
		ContactBubbleComponent,
		PopoverMessageComponent,
		RoomInfoComponent,
		MessageDetailComponent,
		AudioRecorderComponent,
		AudioPlayerComponent,
		CallHistoryComponent
	],
	entryComponents: [
		RoomItemComponent,
		RoomComponent,
		NewChatComponent,
		GroupSetupComponent,
		ContactBubbleComponent,
		PopoverMessageComponent,
		RoomInfoComponent,
		MessageDetailComponent,
		AudioRecorderComponent,
		AudioPlayerComponent,
		CallHistoryComponent
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})

export class ChatComponentsModule {

}
