import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { SwiperModule } from 'ngx-swiper-wrapper';
import { IonicImageViewerModule } from 'ionic-img-viewer';

import { PipesModule } from '../../../pipes/pipes.module';

import { QuestionComponent } from './question/question';
import { QuestionnaireComponent } from './questionnaire/questionnaire';
import { AmbitsComponent } from './ambits/ambits';
import { RadioQuestionComponent } from './radio-question/radio-question';
import { PhotoQuestionComponent } from './photo-question/photo-question';
import { CheckboxQuestionComponent } from './checkbox-question/checkbox-question';
import { FileQuestionComponent } from './file-question/file-question';
import { EmailQuestionComponent } from './email-question/email-question';
import { IncidentQuestionComponent } from './incident-question/incident-question';
import { NotificationQuestionComponent } from './notification-question/notification-question';
import { NumericQuestionComponent } from './numeric-question/numeric-question';
import { PercentageQuestionComponent } from './percentage-question/percentage-question';
import { TextQuestionComponent } from './text-question/text-question';
import { DateQuestionComponent } from './date-question/date-question';
import { RequiredPhotoActionComponent } from './required-photo-action/required-photo-action';
import { IncompleteQuestionsComponent } from './incomplete-questions/incomplete-questions';
import { AllChecklistsComponent } from './all-checklists/all-checklists';
import { OwnChecklistsComponent } from './own-checklists/own-checklists';
import { QuestionnaireTemplateComponent } from './questionnaire-template/questionnaire-template';
import { BranchOfficeSelectComponent } from './branch-office-select/branch-office-select';
import { ChecklistHistoricalComponent } from './checklist-historical/checklist-historical';

@NgModule({
	imports: [
		IonicModule,
		PipesModule,
		SwiperModule,
		IonicImageViewerModule
	],
	declarations: [
		QuestionComponent,
		QuestionnaireComponent,
		AmbitsComponent,
		RadioQuestionComponent,
		PhotoQuestionComponent,
		CheckboxQuestionComponent,
		FileQuestionComponent,
		EmailQuestionComponent,
		IncidentQuestionComponent,
		NotificationQuestionComponent,
		NumericQuestionComponent,
		PercentageQuestionComponent,
		TextQuestionComponent,
		DateQuestionComponent,
		RequiredPhotoActionComponent,
		IncompleteQuestionsComponent,
		AllChecklistsComponent,
		OwnChecklistsComponent,
		QuestionnaireTemplateComponent,
		BranchOfficeSelectComponent,
		ChecklistHistoricalComponent	
	],
	entryComponents: [
		QuestionComponent,
		QuestionnaireComponent,
		AmbitsComponent,
		RadioQuestionComponent,
		PhotoQuestionComponent,
		CheckboxQuestionComponent,
		FileQuestionComponent,
		EmailQuestionComponent,
		IncidentQuestionComponent,
		NotificationQuestionComponent,
		NumericQuestionComponent,
		PercentageQuestionComponent,
		TextQuestionComponent,
		DateQuestionComponent,
		RequiredPhotoActionComponent,
		IncompleteQuestionsComponent,
		AllChecklistsComponent,
		OwnChecklistsComponent,
		QuestionnaireTemplateComponent,
		BranchOfficeSelectComponent,
		ChecklistHistoricalComponent,
		
	],
	exports: [
		QuestionComponent,
		QuestionnaireComponent,
		AmbitsComponent,
		RadioQuestionComponent,
		PhotoQuestionComponent,
		CheckboxQuestionComponent,
		FileQuestionComponent,
		EmailQuestionComponent,
		IncidentQuestionComponent,
		NotificationQuestionComponent,
		NumericQuestionComponent,
		PercentageQuestionComponent,
		TextQuestionComponent,
		DateQuestionComponent,
		RequiredPhotoActionComponent,
		IncompleteQuestionsComponent,
		AllChecklistsComponent,
		OwnChecklistsComponent,
		QuestionnaireTemplateComponent,
		BranchOfficeSelectComponent,
		ChecklistHistoricalComponent
	]
})
export class ChecklistsComponentsModule { }
