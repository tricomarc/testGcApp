import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LazyLoadImageModule } from 'ng-lazyload-image';

import { ChatPage } from './chat';

import { ChatComponentsModule } from './components/chat-components.module';
import { PipesModule } from '../../pipes/pipes.module';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
	declarations: [
		ChatPage
	],
	imports: [
		IonicPageModule.forChild(ChatPage),
		LazyLoadImageModule,
		ChatComponentsModule,
		PipesModule,
		ComponentsModule
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})

export class ChatPageModule { }
