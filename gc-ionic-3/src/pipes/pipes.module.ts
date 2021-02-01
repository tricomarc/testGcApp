import { NgModule } from '@angular/core';

import { SanitizeImgPipe } from './sanitize-img/sanitize-img';
import { OrderByDistancePipe } from './order-by/order-by-distance';
import { OrderAmbitsPipe } from './order-by/order-ambits';
import { OrderUsersPipe } from './order-by/order-users.pipe';
import { ThousandSuffixesPipe } from './short-numbers/short-numbers';
import { CleanDatePipe } from './dates/clean-date';
import { OrderChatMessagesPipe } from './order-by/order-chat-messages';
import { ElapsedTimePipe } from './dates/elapsed-time';
import { OrderRoomsPipe } from './order-by/order-rooms';
import { UserBreakPipe } from './user-break/user-break';
import { RoomFilterPipe } from './filters/filter-room.pipe';
import { ContactFilterPipe } from './filters/filter-contacts.pipe';
import { OrderRoomDatesPipe } from './order-by/order-room-dates';
import { MessagePreviewPipe } from './message-preview.pipe';
import { TruncateTextPipe } from './truncate-text/truncate-text';
import { SanitizeHtmlPipe } from './sanitize-html.pipe';
import { SecondsToMinutesPipe } from './second-to-minutes.pipe';
import { Nl2brPipe } from './nl2br';
import { SynonymousPipe } from './synonymous.pipe';
import { SafeStylePipe } from './safe-style.pipe';
import { OrderChecklistPipe } from './order-by/order-checklist';

@NgModule({
	declarations: [
		SanitizeImgPipe,
		OrderByDistancePipe,
		OrderAmbitsPipe,
		ThousandSuffixesPipe,
		CleanDatePipe,
		OrderChatMessagesPipe,
		ElapsedTimePipe,
		OrderRoomsPipe,
		UserBreakPipe,
		RoomFilterPipe,
		ContactFilterPipe,
		OrderUsersPipe,
		OrderRoomDatesPipe,
		MessagePreviewPipe,
		TruncateTextPipe,
		SanitizeHtmlPipe,
		SecondsToMinutesPipe,
		Nl2brPipe,
		SynonymousPipe,
		SafeStylePipe,
    	OrderChecklistPipe
	],
	imports: [],
	exports: [
		SanitizeImgPipe,
		OrderByDistancePipe,
		OrderAmbitsPipe,
		ThousandSuffixesPipe,
		CleanDatePipe,
		OrderChatMessagesPipe,
		ElapsedTimePipe,
		OrderRoomsPipe,
		UserBreakPipe,
		RoomFilterPipe,
		ContactFilterPipe,
		OrderUsersPipe,
		OrderRoomDatesPipe,
		MessagePreviewPipe,
		TruncateTextPipe,
		SanitizeHtmlPipe,
		SecondsToMinutesPipe,
		Nl2brPipe,
		SynonymousPipe,
		SafeStylePipe,
    	OrderChecklistPipe
	]
})
export class PipesModule { }
