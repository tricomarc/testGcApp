import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, Inject } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule, Platform } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { IonicStorageModule } from '@ionic/storage';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Device } from '@ionic-native/device';
import { AppVersion } from '@ionic-native/app-version';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { MediaCapture } from '@ionic-native/media-capture';
import { Base64 } from '@ionic-native/base64';
import { Camera } from '@ionic-native/camera';
import { Media } from '@ionic-native/media';
import { Geolocation } from '@ionic-native/geolocation';
import { Ng2GoogleChartsModule } from 'ng2-google-charts';
import { FileTransfer } from '@ionic-native/file-transfer';
import { File } from '@ionic-native/file';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { LongPressModule } from 'ionic-long-press';
import { OneSignal } from '@ionic-native/onesignal';
import { Badge } from '@ionic-native/badge';
import { DatePicker } from '@ionic-native/date-picker';
import { Network } from "@ionic-native/network";
import { Pro } from '@ionic-native/pro';
import { Pro as _Pro } from '@ionic/pro';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Insomnia } from '@ionic-native/insomnia';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicImageViewerModule } from 'ionic-img-viewer';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { OpenNativeSettings } from '@ionic-native/open-native-settings';
import { PhonegapLocalNotification } from '@ionic-native/phonegap-local-notification';
import { FileChooser } from '@ionic-native/file-chooser';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { SQLite } from '@ionic-native/sqlite';
import { IOSFilePicker } from '@ionic-native/file-picker';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { FileOpener } from '@ionic-native/file-opener';
import { NativeGeocoder } from '@ionic-native/native-geocoder';

import * as Hammer from 'hammerjs';

import 'rxjs/Rx';
import { IonicSelectableModule } from 'ionic-selectable';

import { PdfViewerModule } from 'ng2-pdf-viewer';

// import * as sha256 from 'js-sha256';


/* VIDEO PLAYER */
import { VgCoreModule } from 'videogular2/core';
import { VgControlsModule } from 'videogular2/controls';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { VgBufferingModule } from 'videogular2/buffering';

// Páginas
import { GcApp } from './app.component';

// Módulos
import { IndexPageModule } from '../pages/index/index.module';
import { ComponentsModule } from '../components/components.module';
import { LoginPageModule } from '../pages/login/login.module';
import { ComunicadosTiendaPageModule } from '../pages/comunicados/tienda/comunicados-tienda.module';
import { ComunicadosZonalPageModule } from '../pages/comunicados/zonal/comunicados-zonal.module';
import { DashboardModule } from '../pages/dashboard/tienda/dashboard.module';
import { EstadisticasModule } from '../pages/dashboard/zonal/estadisticas.module';
import { ChecklistDetailsModule } from '../pages/dashboard/zonal/sub-pages/checklist/checklist.module';
import { DetailsChecklistSubsidiaryModule } from '../pages/dashboard/zonal/sub-pages/checklist/components/detalle/detalle.module';
import { ChecklistDetailsChecklistPageModule } from '../pages/dashboard/zonal/sub-pages/checklist/components/checklist-details/checklist-details.module';
import { ComunicadosDetailsModule } from '../pages/dashboard/zonal/sub-pages/comunicados/comunicados.module';
import { DetailsComunicadosSubsidiaryModule } from '../pages/dashboard/zonal/sub-pages/comunicados/components/detalle/detalle.module';
import { UserDetailsComunicadosModule } from '../pages/dashboard/zonal/sub-pages/comunicados/components/user-details/user-details.module';
import { ControlDetailsModule } from '../pages/dashboard/zonal/sub-pages/control/control.module';
import { IncidenciasDetailsModule } from '../pages/dashboard/zonal/sub-pages/incidencias/incidencias.module';
import { KpiDetailsModule } from '../pages/dashboard/zonal/sub-pages/kpi/kpi.module';
import { DetailsKpiSubsidiaryModule } from '../pages/dashboard/zonal/sub-pages/kpi/components/detalle/detalle.module';
import { PremiosDetailsModule } from '../pages/dashboard/zonal/sub-pages/premios/premios.module';
import { ValesDetailsModule } from '../pages/dashboard/zonal/sub-pages/vales/vales.module';
import { VisualDetailsModule } from '../pages/dashboard/zonal/sub-pages/visual/visual.module';
import { DetailsVisualSubsidiaryModule } from '../pages/dashboard/zonal/sub-pages/visual/components/detalle/detalle.module';
import { ChangePasswordPageModule } from '../pages/change-password/change-password.module';
import { ChecklistTiendaPageModule } from '../pages/checklist/tienda/checklist-tienda.module';
import { ChecklistZonalPageModule } from '../pages/checklist/zonal/checklist-zonal.module';
import { PreguntasChecklistPageModule } from '../pages/checklist/components/preguntas-checklist-directive/preguntas-checklist.module';
import { AmbitoPageModule } from '../pages/checklist/sub-pages/ambito/ambito.module';
import { AmbitosPageModule } from '../pages/checklist/sub-pages/ambitos/ambitos.module';
import { DetallePageModule } from '../pages/checklist/sub-pages/detalle/detalle.module';
import { HistoricoPageModule } from '../pages/checklist/sub-pages/historico/historico.module';
import { HistoricoEvaluadosPageModule } from '../pages/checklist/sub-pages/historico-evaluados/historico-evaluados.module';
import { OcacionalesPageModule } from '../pages/checklist/sub-pages/ocacionales/ocacionales.module';
import { RecoverPasswordPageModule } from "../pages/recover-password/recover-password.module";
import { AddIncidentPageModule } from "../pages/incidents/branch-office/sub-pages/add-incident/add-incident.module";
import { DetailIncidentPageModule } from "../pages/incidents/branch-office/sub-pages/detail-incident/detail-incident.module";
import { LogsIncidentPageModule } from "../pages/incidents/branch-office/sub-pages/logs-incident/logs-incident.module";
import { EvaluateIncidentPageModule } from "../pages/incidents/branch-office/sub-pages/evaluate-incident/evaluate-incident.module";
import { ProvidersIncidentPageModule } from "../pages/incidents/branch-office/sub-pages/providers-incident/providers-incident.module";
import { IncidentsAdminPageModule } from "../pages/incidents/admin/incidents-admin.module";
import { DetailIncidentAdminPageModule } from "../pages/incidents/admin/sub-pages/detail-incident-admin/detail-incident-admin.module";
import { StatusIncidentPageModule } from "../pages/incidents/admin/sub-pages/status-incident/status-incident.module";
import { KpiRipleyPageModule } from '../pages/kpi/custom/ripley/kpi-ripley.module';
import { VisualRevisionPageModule } from '../pages/visual/branch-office/visual-revision/visual-revision.module';
import { VisitaPageModule } from '../pages/visita/visita.module';
import { MapPageModule } from '../pages/visita/sub-pages/map/map.module';
import { VisitaSucursalPageModule } from '../pages/visita/sub-pages/sucursal/sucursal.module';
import { GuardadosPageModule } from '../pages/visita/sub-pages/guardados/guardados.module';
import { FinalizadasPageModule } from '../pages/checklist/sub-pages/finalizadas/finalizadas.module';
import { FinalizadasDetallePageModule } from '../pages/checklist/sub-pages/finalizadas/sub-pages/finalizadas-detalle/finalizadas-detalle.module';
import { NoEnviadasPageModule } from '../pages/visita/sub-pages/no-enviadas/no-enviadas.module';
import { HistoricasPageModule } from '../pages/visita/sub-pages/historicas/historicas.module';
import { VisitasHistoricasSucursalPageModule } from '../pages/visita/sub-pages/historicas/sub-pages/visitas-historicas-sucursal/visitas-historicas-sucursal.module';
import { VisitaDetallePageModule } from '../pages/visita/sub-pages/historicas/sub-pages/visita-detalle/visita-detalle.module';
import { VisitaAmbitosPageModule } from '../pages/visita/sub-pages/historicas/sub-pages/visita-ambitos/visita-ambitos.module';
import { AsignacionPageModule } from '../pages/visita/sub-pages/asignacion/asignacion.module';
import { VisualRevisionDetailPageModule } from '../pages/visual/branch-office/visual-revision-detail/visual-revision-detail.module';
import { MaterialDetailPageModule } from '../pages/materials/material-detail/material-detail.module';
import { ReportMaterialPageModule } from '../pages/materials/report-material/report-material.module';
import { EditMaterialReportPageModule } from '../pages/materials/edit-material-report/edit-material-report.module';
import { TasksBranchOfficePageModule } from '../pages/tasks/branch-office/tasks-branch-office.module';
import { FilesPageModule } from '../pages/files/files.module';
import { VisualZonalPageModule } from '../pages/visual/zonal/visual-zonal.module';
import { VisualZonalDetailPageModule } from '../pages/visual/zonal/visual-zonal-detail/visual-zonal-detail.module';
import { KnowledgeBasePageModule } from '../pages/knowledge-base/knowledge-base.module';
import { SolutionsPageModule } from '../pages/knowledge-base/solutions/solutions.module';
import { RankingVisualPageModule } from '../pages/visual/zonal/ranking/ranking-visual.module';
import { VisualHistoryPageModule } from '../pages/visual/branch-office/visual-history/visual-history.module';
import { VerRutasPageModule } from '../pages/ver-rutas/ver-rutas.module';
import { DetalleRutaPageModule } from '../pages/ver-rutas/detalle-ruta/detalle-ruta.module';

import { RelojControlPageModule } from '../pages/reloj-control/reloj-control.module';
import { PhotoAccessPageModule } from '../pages/reloj-control/sub-pages/photo-access/photo-access.module';
import { WeekPageModule } from '../pages/reloj-control/sub-pages/week/week.module';
import { DetailsMonthPageModule } from '../pages/reloj-control/sub-pages/details-month/details-month.module';

import { KpiTricotPageModule } from '../pages/kpi/custom/tricot/kpi-tricot.module';

//Borrar
import { Tareas1PageModule } from '../pages/tasks/sub-pages/tareas1/tareas1.module';
import { Tareas2PageModule } from '../pages/tasks/sub-pages/tareas2/tareas2.module';
import { Tareas3PageModule } from '../pages/tasks/sub-pages/tareas3/tareas3.module';
import { Tareas4PageModule } from '../pages/tasks/sub-pages/tareas4/tareas4.module';
//Hasta aca

/*CHAT*/
import { ChatPageModule } from '../pages/chat/chat.module';
// import { AddChatPageModule } from '../pages/chat/add-chat/add-chat.module';
// import { MessagesPageModule } from '../pages/chat/messages/messages.module';
import { ChatComponentsModule } from '../pages/chat/components/chat-components.module';
import { MapComponentsModule } from '../pages/map-visit/components/map-components.module';
import { KpiComponentsModule } from '../pages/kpi/components/kpi-components.module';

// Módulos
import { VisualPageModule } from '../pages/visual/branch-office/visual.module';
import { VisualReportPageModule } from '../pages/visual/branch-office/visual-report/visual-report.module';
import { SendReportPageModule } from '../pages/visual/branch-office/send-report/send-report.module';
import { EditReportPageModule } from '../pages/visual/branch-office/edit-report/edit-report.module';
import { ShowReportPageModule } from '../pages/visual/branch-office/show-report/show-report.module';
import { IncidentsBranchOfficePageModule } from '../pages/incidents/branch-office/incidents-branch-office.module';
import { MaterialsPageModule } from '../pages/materials/materials.module';
import { KpiColgramPageModule } from '../pages/kpi/custom/colgram/kpi-colgram.module';
import { IndexOperaappPageModule } from '../pages/index/custom/operaapp/index-operaapp.module';
import { MapVisitPageModule } from '../pages/map-visit/map-visit.module';
import { NotificationsPageModule } from '../pages/notifications/notifications.module';

import { ChecklistsBranchOfficePageModule } from '../pages/checklists/branch-office/checklists-branch-office.module';
import { ChecklistsZonalPageModule } from '../pages/checklists/zonal/checklists-zonal.module';
import { ChecklistsComponentsModule } from '../pages/checklists/components/checklists-components.module';

import { ChecklistsSucursalPageModule } from '../pages/checklist/sub-pages/checklists-sucursal/checklists-sucursal.module';
import { AmbitoSucursalPageModule } from '../pages/checklist/sub-pages/ambito-sucursal/ambito-sucursal.module';

// DISEÑO
import { MaquetasPageModule } from '../pages/maquetas/maquetas.module';
import { ReconocimientoPageModule } from '../pages/reconocimiento/reconocimiento.module';

// Componentes
import { MenuComponent } from '../components/menu/menu';
import { ComunicadoComponent } from '../pages/comunicados/components/comunicado/comunicado';
import { CuestionarioComponent } from '../pages/comunicados/components/cuestionario/cuestionario';
import { EquipoComponent } from '../pages/comunicados/components/equipo/equipo';
import { RespuestasComponent } from '../pages/comunicados/components/respuestas/respuestas';
import { PhotoViewerComponent } from '../components/photo-viewer/photo-viewer';
import { NoImplementationComponent } from '../components/no-implementation/no-implementation';
import { UpdateComponent } from '../components/update/update';
import { PermissionRequestComponent } from '../components/permissions-request/permissions-request';
import { ExternalSiteComponent } from '../components/external-site/external-site';
import { SignatureViewerComponent } from '../components/signature-viewer/signature-viewer';

// Proveedores
import { RequestProvider } from '../shared/providers/request/request';
import { SessionProvider } from '../shared/providers/session/session';
import { UtilProvider } from '../shared/providers/util/util';
import { RequestInterceptor } from '../shared/helpers/request-interceptor';
import { UpdateProvider } from '../shared/providers/update/update';
import { LoadMenuProvider } from '../shared/providers/util/loadMenu';
import { CameraProvider } from '../shared/providers/camera/camera';
import { DatePipe } from '@angular/common';
import { GoogleMaps } from '@ionic-native/google-maps';
import { PushNotificationProvider } from '../shared/providers/push-notifications/push-notification';
import { VisualLocalProvider } from '../pages/visual/services/visual.local';
import { ChecklistsProvider } from '../pages/checklists/checklists.provider';

import { ChatLocalProvider } from '../pages/chat/services/chat.local';
import { MesiboProvider } from '../shared/providers/mesibo/mesibo';
import { MesiboCordova } from '../shared/custom-plugins/mesibo.plugin';
import { LocalizaProvider } from '../shared/providers/localiza/localiza';
import { FirebaseAnalyticsProvider } from '../shared/providers/firebase-analytics/firebase-analytics';
import { BluetoothService } from '../shared/providers/bluetooth/bluetooth';

import { PipesModule } from '../pipes/pipes.module';

import { NgCalendarModule } from 'ionic2-calendar';

import { globalConfig } from '../config';
import { global } from '../shared/config/global';

import { SwiperModule } from 'ngx-swiper-wrapper';
import { SWIPER_CONFIG } from 'ngx-swiper-wrapper';
import { SwiperConfigInterface } from 'ngx-swiper-wrapper';
import { MiGestionPageModule } from '../pages/mi-gestion/mi-gestion.module';
import { ModalNoImplementarPageModule } from '../pages/visual/modal-no-implementar/modal-no-implementar.module';
import { ModalLoginAsPageModule } from '../pages/login/modal-login-as/modal-login-as.module';
import { LocalesAsociadosPageModule } from '../pages/seguimiento-vale/locales-asociados/locales-asociados.module';
import { IngresarBoletaPageModule } from '../pages/seguimiento-vale/detalle-seguimiento/ingresar-boleta/ingresar-boleta.module';
import { SeguimientoValePageModule } from '../pages/seguimiento-vale/seguimiento-vale.module';
import { ReporteUsabilidadPageModule } from '../pages/reporte-usabilidad/reporte-usabilidad.module';
import { LeanPageModule } from '../pages/lean/lean.module';
import { KpiMaicaoPageModule } from '../pages/kpi/custom/maicao/kpi-maicao.module';

import { TaskManagerPageModule } from '../pages/task-manager/task-manager.module';

import { BluetoothLE } from '@ionic-native/bluetooth-le';
import { TermsComponent } from '../components/terms/terms';
import { IncidentsZonalPageModule } from '../pages/incidents/zonal/incidents-zonal.module';
import { DictionaryProvider } from '../shared/providers/dictionary/dictionary';
import { SecurityQuestionPageModule } from '../pages/recover-password/security-question/security-question.module';
import { Avram } from '../shared/custom-plugins/avram';
import { CameraComponent } from '../shared/providers/camera/component/camera';
import { CameraPreview } from '@ionic-native/camera-preview';

const DEFAULT_SWIPER_CONFIG: SwiperConfigInterface = {
    direction: 'horizontal',
    slidesPerView: 'auto',
    pagination: {
        type: 'bullets',
        el: '.bullets-sw'
    }
};

// Clase que nos ayuda a manejar los errores de la app a nivel global
export class CustomErrorHandler implements ErrorHandler {

    constructor(@Inject(RequestProvider) private request: RequestProvider, @Inject(Platform) private platform: Platform) {
    }

    // Recibe el error e intenta grabarlo en la API
    handleError(error: any): void {
        console.log('handleError', error);
        if (this.platform.is('cordova')) {
            try {
                const body = {
                    "version_app": globalConfig.version,
                    "so": (this.platform.is('ios') ? 'iOS' : this.platform.is('android') ? 'Android' : 'Browser'),
                    "error": error.toString()
                };

                this.request.post('/errorlog/error', body, true).then((response: any) => { }).catch((apiError: any) => { });

                try { _Pro.getApp().monitoring.log('Error', { level: 'error' }, { error: body }); } catch (e) { }

            } catch (e) {
                try { _Pro.getApp().monitoring.log('Error', { level: 'error' }, { error: e }); } catch (e) { }
            }
        }
    }
}

// Clase que nos ayuda a definir o sobre escribir eventos para los elementos HTML de la vista
export class MyHammerConfig extends HammerGestureConfig {
    overrides = {
        'pinch': { direction: Hammer.DIRECTION_ALL }
    }
}

@NgModule({
    declarations: [
        GcApp,
        // Componentes
        MenuComponent,
        PhotoViewerComponent,
        UpdateComponent,
        PermissionRequestComponent,
        TermsComponent,
        NoImplementationComponent,
        ExternalSiteComponent,
        CameraComponent
    ],
    imports: [
        BrowserModule,
        IonicModule.forRoot(GcApp, {
            backButtonText: '',
            navExitApp: false,
            platforms: {
                ios: {
                    swipeBackEnabled: false
                }
            }
            // mode: 'ios'
        }),
        IonicStorageModule.forRoot(),
        HttpClientModule,
        IndexPageModule,
        DashboardModule,
        ComunicadosTiendaPageModule,
        ComunicadosZonalPageModule,
        EstadisticasModule,
        ChecklistDetailsModule,
        ComunicadosDetailsModule,
        ChecklistDetailsChecklistPageModule,
        DetailsChecklistSubsidiaryModule,
        DetailsComunicadosSubsidiaryModule,
        UserDetailsComunicadosModule,
        DetailsVisualSubsidiaryModule,
        ControlDetailsModule,
        IncidenciasDetailsModule,
        KpiDetailsModule,
        DetailsKpiSubsidiaryModule,
        PremiosDetailsModule,
        ValesDetailsModule,
        VisualDetailsModule,
        ChangePasswordPageModule,
        ChecklistTiendaPageModule,
        ChecklistZonalPageModule,
        ChecklistsSucursalPageModule,
        PreguntasChecklistPageModule,
        AmbitoPageModule,
        AmbitoSucursalPageModule,
        AmbitosPageModule,
        DetallePageModule,
        HistoricoPageModule,
        VisitaSucursalPageModule,
        VisitaDetallePageModule,
        VisitaAmbitosPageModule,
        AsignacionPageModule,
        HistoricoEvaluadosPageModule,
        OcacionalesPageModule,
        LoginPageModule,
        RecoverPasswordPageModule,
        SecurityQuestionPageModule,
        ComponentsModule,
        ChatComponentsModule,
        MapComponentsModule,
        KpiComponentsModule,
        IncidentsBranchOfficePageModule,
        AddIncidentPageModule,
        DetailIncidentPageModule,
        LogsIncidentPageModule,
        EvaluateIncidentPageModule,
        ProvidersIncidentPageModule,
        IncidentsAdminPageModule,
        DetailIncidentAdminPageModule,
        StatusIncidentPageModule,
        KpiRipleyPageModule,
        KpiTricotPageModule,
        KpiMaicaoPageModule,
        TaskManagerPageModule,
        VisualRevisionPageModule,
        VisitaPageModule,
        VisitasHistoricasSucursalPageModule,
        MapPageModule,
        VisitaSucursalPageModule,
        GuardadosPageModule,
        FinalizadasPageModule,
        FinalizadasDetallePageModule,
        NoEnviadasPageModule,
        HistoricasPageModule,
        VisualRevisionDetailPageModule,
        MaterialsPageModule,
        MaterialDetailPageModule,
        ReportMaterialPageModule,
        EditMaterialReportPageModule,
        TasksBranchOfficePageModule,
        FilesPageModule,
        VisualZonalPageModule,
        VisualZonalDetailPageModule,
        ChatPageModule,
        // AddChatPageModule,
        // MessagesPageModule,
        KnowledgeBasePageModule,
        SolutionsPageModule,
        RankingVisualPageModule,
        VisualHistoryPageModule,

        RelojControlPageModule,
        PhotoAccessPageModule,
        WeekPageModule,
        DetailsMonthPageModule,
        KpiColgramPageModule,
        IndexOperaappPageModule,
        MapVisitPageModule,
        ChecklistsBranchOfficePageModule,
        ChecklistsComponentsModule,
        ChecklistsZonalPageModule,
        NotificationsPageModule,
        MiGestionPageModule,
        ModalNoImplementarPageModule,
        ModalLoginAsPageModule,
        LocalesAsociadosPageModule,
        IngresarBoletaPageModule,
        SeguimientoValePageModule,
        VerRutasPageModule,
        DetalleRutaPageModule,
        ReporteUsabilidadPageModule,
        LeanPageModule,

        //Borrar
        Tareas1PageModule,
        Tareas2PageModule,
        Tareas3PageModule,
        Tareas4PageModule,

        // DISEÑO
        MaquetasPageModule,
        ReconocimientoPageModule,

        /* VIDEO PLAYER */
        VgCoreModule,
        VgControlsModule,
        VgOverlayPlayModule,
        VgBufferingModule,

        LongPressModule,
        RoundProgressModule,
        LazyLoadImageModule,

        NgCalendarModule,
        IonicSelectableModule,
        BrowserAnimationsModule,
        IonicImageViewerModule,
        SwiperModule,
        PipesModule,
        PdfViewerModule
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        GcApp,
        // Componentes
        MenuComponent,
        PhotoViewerComponent,
        SignatureViewerComponent,
        UpdateComponent,
        PermissionRequestComponent,
        TermsComponent,
        NoImplementationComponent,
        ExternalSiteComponent,
        CameraComponent
    ],
    exports: [
        LoginPageModule,
        VisualPageModule,
        VisualReportPageModule,
        SendReportPageModule,
        EditReportPageModule,
        ShowReportPageModule,
        AmbitoPageModule,
        HistoricoPageModule,
        DetallePageModule,
        HistoricoEvaluadosPageModule,
        ChecklistTiendaPageModule,
        ChangePasswordPageModule,
        AmbitosPageModule,
        OcacionalesPageModule,
        RecoverPasswordPageModule
    ],
    providers: [
        StatusBar,
        SplashScreen,
        RequestProvider,
        Device,
        AppVersion,
        DatePipe,
        BluetoothLE,
        { provide: ErrorHandler, useClass: CustomErrorHandler },
        { provide: HAMMER_GESTURE_CONFIG, useClass: MyHammerConfig },
        { provide: HTTP_INTERCEPTORS, useClass: RequestInterceptor, multi: true },
        SessionProvider,
        UtilProvider,
        UpdateProvider,
        LoadMenuProvider,
        CameraProvider,
        PushNotificationProvider,
        VisualLocalProvider,
        ChatLocalProvider,
        MesiboProvider,
        MesiboCordova,
        ChecklistsProvider,
        InAppBrowser,
        MediaCapture,
        Base64,
        Camera,
        Media,
        Geolocation,
        Ng2GoogleChartsModule,
        FileTransfer,
        File,
        AndroidPermissions,
        GoogleMaps,
        OneSignal,
        Badge,
        DatePicker,
        Network,
        Pro,
        WebView,
        BarcodeScanner,
        Diagnostic,
        Insomnia,
        LocationAccuracy,
        LocalNotifications,
        OpenNativeSettings,
        PhonegapLocalNotification,
        FileChooser,
        SQLite,
        IOSFilePicker,
        Keyboard,
        LocalNotifications,
        FileOpener,
        NativeGeocoder,
        CameraPreview,
        /* GoogleAnalytics, */
        {
            provide: SWIPER_CONFIG,
            useValue: DEFAULT_SWIPER_CONFIG
        },
        LocalizaProvider,
        FirebaseAnalyticsProvider,
        BluetoothService,
        DictionaryProvider,
        Avram
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class AppModule {

}
