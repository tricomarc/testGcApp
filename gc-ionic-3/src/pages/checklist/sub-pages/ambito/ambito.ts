import { ApplicationRef, Component, ViewChild } from '@angular/core';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser';
import {
    IonicPage,
    LoadingController,
    NavController,
    NavParams,
    Events,
    AlertController,
    MenuController,
    Content,
    ActionSheetController,
    ModalController
} from 'ionic-angular';
import { config } from "../../tienda/checklist-tienda.config";

import { RequestProvider } from "../../../../shared/providers/request/request";
import { UtilProvider } from "../../../../shared/providers/util/util";
import * as _ from 'lodash';
import sortBy from 'sort-by/index';

import { DetallePage } from "../detalle/detalle";
import { SessionProvider } from "../../../../shared/providers/session/session";
import { Storage } from "@ionic/storage";
import { global } from '../../../../shared/config/global'
import { SignatureViewerComponent } from '../../../../components/signature-viewer/signature-viewer';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
    selector: 'page-ambito',
    templateUrl: 'ambito.html',
})

export class AmbitoPage {

    @ViewChild(Content) content: Content;

    visita_tienda = [];
    checklist: any = {};
    ambitoTitulo: {};
    thisSession: any = {};
    visita = {};
    ambito: {
        pendientes: null
    };
    visita_id = null;
    sucursal = null;
    cargo = null;
    nombre = null;
    pendientes: boolean = false;
    ready: boolean = false;
    mostrarBotonAmbito: boolean = true;
    settingViewDescripcion: boolean = false;
    deshabilitar: boolean = true;
    onlyWatch: boolean = false;
    mostrarAmbitos: boolean = false;
    mostrarPlantilla: boolean = false;
    isString: boolean = false;
    checklist_id: string;

    suc_id = 0;
    user_id = 0;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private commentary: any = null;
    private fromVisit: any = false;

    private settings = {
        commentaryVisit: false
    };

    private signatureImg: any;
    private fromStats: boolean = false;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private loading: LoadingController,
        private request: RequestProvider,
        private session: SessionProvider,
        private applicationRef: ApplicationRef,
        private util: UtilProvider,
        private event: Events,
        private storage: Storage,
        private alert: AlertController,
        private menu: MenuController,
        private events: Events,
        private actionSheet: ActionSheetController,
        private browser: InAppBrowser,
        private modal: ModalController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {

        UtilProvider.checklistZonalIntent = 0;

    }

    ionViewDidLoad() {
        // tracks de vista
        this.firebaseAnalyticsProvider.trackView( 'AmbitoChecklist' );

        this.fromStats = this.navParams.data.fromStats;
    }

    async ionViewWillEnter() {
        if (global.isString) {
            this.isString = true;
        }

        /**
         * Recibe parametros de sucursal y visita
         * @type {{}}
         */
        this.thisSession = await this.util.getInternalSession();
        
        if (
            this.thisSession
            && this.thisSession.usuario
            && this.thisSession.usuario.settings
        ) {
            let commentaryVisitSetting = _.find(this.thisSession.usuario.settings, (setting: any) => {
                return (setting.nombre === 'checklist_link_visitas' && setting.visible);
            });
            
            if (commentaryVisitSetting) {
                this.settings.commentaryVisit = true;
            }
        }

        this.checklist_id = this.navParams.data.checklist_id;
       
        // Si proviene desde visitas
        if (!_.isUndefined(this.navParams.data.visita) && !_.isNull(this.navParams.data.visita)) {
            if (!_.isUndefined(this.navParams.data.checklist_id) && !_.isNull(this.navParams.data.checklist_id)) {
                this.visita_id = this.navParams.data.visita_id;
            }
            if (!_.isUndefined(this.navParams.data.sucursal_id) && !_.isNull(this.navParams.data.sucursal_id)) {
                this.sucursal = this.navParams.data.sucursal_id;
            }
           
            this.getDatafromMemory(this.navParams.data.checklist_id);
            
            this.getVisitCommentary(this.navParams.data.checklist_id, this.sucursal);
            
            this.fromVisit = true;
        } else {
            
            // Si proviene desde checklist
            var setDescripcion = this.thisSession['usuario'].settings;
            
            var setDescripcion2 = _.find(setDescripcion, { nombre: 'checklist_introduccion' });
            
            if (!_.isUndefined(setDescripcion2)) {
                if (setDescripcion2.valor == 1 && setDescripcion2.visible == 1) {
                    this.settingViewDescripcion = true;
                }
            }
            
            // onlyWatch desde checklist/zonal/tienda
            if (!_.isUndefined(this.navParams.data.onlyWatch) && !_.isNull(this.navParams.data.onlyWatch)) {
                this.onlyWatch = true;
            }

            if (!_.isUndefined(this.navParams.data.suc_id) && !_.isNull(this.navParams.data.suc_id)) {
                this.suc_id = this.navParams.data.suc_id;
            }
            
            if (!_.isUndefined(this.navParams.data.user_id) && !_.isNull(this.navParams.data.user_id)) {
                this.user_id = this.navParams.data.user_id;
            }
            
            if (!_.isUndefined(this.navParams.data.cargo) && !_.isNull(this.navParams.data.cargo)) {
                this.cargo = this.navParams.data.cargo;
            }
            
            if (!_.isUndefined(this.navParams.data.nombre) && !_.isNull(this.navParams.data.nombre)) {
                this.nombre = this.navParams.data.nombre;
            }
            this.getChecklistDetails(this.checklist_id);
        }

        // recibo la imagen
        this.signatureImg = this.navParams.get( 'signatureImg' );
    }

    /**
     * Envia aviso de actualización a checklist zonal propio
     */
    async ionViewDidLeave() {this.menu.enable(true, "menu");
        /*let result = await this.session.getSession();
        if(result['usuario'].jerarquia >= 98) this.events.publish("returnCheckZonalList", true)*/
    }

    /**
     * Refresca vista actual
     * @param refresher
     * @returns {Promise<void>}
     */
    async refreshChecklist( checklist ) {
        if (!_.isUndefined(this.navParams.data.visita) && !_.isNull(this.navParams.data.visita)) {
            this.getDatafromMemory(checklist)
        } else {
            await this.getChecklistDetails( checklist );
        }
    }

    /**
     * Trae Detalles del checklist seleccionado
     * @param checklist_id
     * @returns {Promise<{}>}
     */
    async getChecklistDetails( checklist_id ) {
        let active = this.navCtrl.getActive();
        
        if ( active.instance instanceof DetallePage || active.instance instanceof AmbitoPage ) {
            const loading = this.loading.create({ content: 'Obteniendo checklist' });
            
            loading.present();
            
            
            let data = {};
            
            await this.request
            .get(config.endpoints.get.asignacion + checklist_id, true)
            .then((response: any) => {
                try {
                    if (!_.isUndefined(response.code)) {
                        if (response.code == 403) {
                            this.util.showAlert("Atención", "No se envio levantamiento");
                        }
                        if (!_.isUndefined(response.data)) {
                            this.checklist = response.data;

                            if (this.checklist["estado_id"] == 4) {
                                this.deshabilitar = true;
                            } else {
                                this.deshabilitar = false;
                            }
                            this.mostrarBotonAmbito = true;
                            //this.checklist["ambitos"] = _.orderBy(this.checklist["ambitos"], 'asc');
                            let noQuestions = _.filter(this.checklist["ambitos"], { total: 0 });

                            if (!_.isNull(noQuestions) && !_.isUndefined(noQuestions)) {

                                _.forEach(noQuestions, (ambito) => {
                                    let indexToDelete = _.indexOf(this.checklist["ambitos"], ambito);
                                    if (indexToDelete > -1) this.checklist["ambitos"].splice(indexToDelete, 1)
                                });

                            }


                            _.forEach(this.checklist["ambitos"], (ambito, index) => {
                                if (ambito.pendientes > 0) {
                                    this.pendientes = true;
                                    this.mostrarBotonAmbito = false;
                                }
                            });
                            
                        }
                        
                        
                        _.forEach(this.checklist["ambitos"], (ambito, index) => {
                            if (ambito.pendientes > 0) {
                                this.pendientes = true;
                                this.mostrarBotonAmbito = false;
                            }
                        });
                        
                        //this.checklist["ambitos"] = _.orderBy(this.checklist["ambitos"], ['orden'],['asc']);
                        this.mostrarAmbitos = true;
                        
                        this.ready = true;
                        
                        this.applicationRef.tick();
                        
                        this.content.resize();
                    }
                    // guardamos la firma para mostrarla antes de enviarla
                    this.signatureImg = localStorage.getItem( 'checklist_signature_' + this.checklist_id );
                    
                    loading.dismiss();
                }
                catch (e) {
                    loading.dismiss();
                }
            })
            .catch((error: any) => {
                loading.dismiss();
                
                if (error && error.message) this.util.showAlert("Atención", error.message);
            });
            return data;
        }
    }

    /**
     * Cambia estado de checklist cuando es enviado, la forma depende del tipo de cuestionario
     * @param id
     * @returns {Promise<{}>}
     */
    async cambiarEstado(id, from, checklist) {
        const loading = this.loading.create({ content: 'Obteniendo checklist' });
        
        loading.present();
        
        if (from == 'checklist') {
            //Si es checklist, se envia a API
            let result = await this.session.getSession();
            
            // agregamos la firma al resto del data para enviar el checklist
            var params = {
                usuario_id: result["usuario"].id,
                session_id: result["sessionid"],
                checklist_id: id,
                firma: this.signatureImg
            };
            
            let data = {};
            
            await this.request
                .post( config.endpoints.post.finalizar, params, true )
                .then( ( response: any ) => {
                    try {
                        loading.dismiss();
                        
                        if ( response.code == 200 ) {
                            let alert = this.alert.create( {
                                title: 'Atención',
                                subTitle: 'Cuestionario actualizado correctamente',
                                buttons: [ {
                                    text: 'Aceptar',
                                    handler: data => {
                                        this.navCtrl.pop();
                                    }
                                } ],
                            } );
                            
                            alert.present();

                            // sin envia todo correctamente, borramos la firma del local storage
                            localStorage.removeItem( 'checklist_signature_' + id );

                        } else if ( !_.isUndefined( response.message ) ) {
                            let alert = this.alert.create( {
                                title: 'Atención',
                                subTitle: '' + response.message,
                                buttons: [ {
                                    text: 'Aceptar',
                                    handler: data => {
                                        //this.navCtrl.pop();
                                    }
                                } ],
                            } );
                            
                            alert.present();
                        } else {
                            let alert = this.alert.create( {
                                title: 'Atención',
                                subTitle: 'El formulario no pudo ser enviado, intente nuevamente',
                                buttons: [ {
                                    text: 'Aceptar',
                                    handler: data => {
                                        //this.navCtrl.pop();
                                    }
                                } ],
                            } );
                        }
                    }
                    catch ( e ) {
                        loading.dismiss();
                    }
                })
                .catch( ( error: any ) => {
                    loading.dismiss();
                    
                    if ( error && error.message ) this.util.showAlert( "Atención", "Ocurrió un error 1, por favor contacte a soporte." );
                });
            return data;
        } else {
            /**
             * Si es visita, el estado se cambia directamente y luego es guardado en memoria
             */
            var state = null;
            
            if ( global.isString ) {
                state = _.find( this.visita_tienda[ 'estados_visita' ], { estado_id: '4' } );
                
                if ( _.isUndefined( state ) || _.isNull( state ) ) state = _.find( this.visita_tienda[ 'estados_visita' ], { estado_id: 4 } )
            }
            
            if ( !global.isString ) {
                state = _.find( this.visita_tienda[ 'estados_visita' ], { estado_id: 4 } );
                
                if ( _.isUndefined( state ) || _.isNull( state ) ) state = _.find( this.visita_tienda[ 'estados_visita' ], { estado_id: '4' } );
            }

            if ( !_.isUndefined( state ) && !_.isNull( state ) ) {
                var visita = _.find( this.visita_tienda[ 'visitas' ], { 'id': this.visita_id } );
                
                if ( !_.isUndefined( visita ) && !_.isNull( visita ) ) {
                    var toSend = {
                        id: visita.id,
                        checklist_id: visita.checklist_id,
                        estado_id: 4,
                        fecha: visita.fecha,
                        modified: true,
                        nombre_estado: state.nombre, // Se le asigna el nombre del estado que viene por DB con el ID seleccionado
                        sucursal_id: visita.sucursal_id,
                        visita_id: visita.visita_id
                    };
                    /*visita = toSend;*/
                    //this.visita_tienda['visitas'].push(toSend);

                } else {
                    var visita = _.find( this.visita_tienda[ 'visitas_respuestas' ], { 'id': this.visita_id } );
                    
                    if ( !_.isUndefined( state ) && !_.isNull( state ) ) {
                        toSend = {
                            id: visita.id,
                            checklist_id: parseInt( this.checklist_id ),
                            estado_id: 4,
                            nombre_estado: state[ 'nombre' ], // Se le asigna el nombre del estado que viene por DB con el ID seleccionado
                            fecha: new Date(),
                            modified: true,
                            sucursal_id: this.sucursal,
                            visita_id: visita.id
                        };
                        
                        if ( _.isUndefined( this.visita_tienda[ 'visitas'] ) || _.isNull( this.visita_tienda[ 'visitas' ] ) ) {
                            this.visita_tienda[ 'visitas' ] = [];
                        }
                        
                        this.visita_tienda[ 'visitas' ].push( toSend );
                    } else {
                        this.util.showAlert( 'Atención', 'Ocurrió un error, por favor intente mas tarde' );
                        
                        loading.dismiss();
                    }
                }

                var visitsToChange = this.visita_tienda[ 'visitas' ]
                
                this.replaceVisit( visitsToChange, toSend ).then( visits => {
                    this.visita_tienda[ 'visitas' ] = visits;
                
                    var index = _.findIndex( this.visita_tienda[ 'checklist_visita' ], { id: id } );
                
                    if (index != -1) {
                        this.visita_tienda[ 'checklist_visita' ][ index ].estado_id = toSend.estado_id;
                        
                        this.visita_tienda[ 'checklist_visita' ][ index ].nombre_estado = toSend.nombre_estado;
                    } else {
                        var visit_checklist = this.checklist;
                        visit_checklist[ 'visita_id' ] = visita.id;
                        visit_checklist[ 'fecha_visita' ] = new Date();
                        visit_checklist[ 'estado_id' ] = 4;
                        visit_checklist[ 'nombre_estado' ] = state[ 'nombre' ];
                        
                        if ( !_.isArray( this.visita_tienda[ 'checklist_visita' ] ) ) this.visita_tienda[ 'checklist_visita' ] = [];
                        this.visita_tienda['checklist_visita'].push(visit_checklist);
                    };

                    _.forEach( this.visita_tienda[ 'checklist_visita' ], ( check ) => {
                        if ( check.estado_id == 4 ) check[ 'send' ] = true

                        if ( check[ 'send' ] && check[ 'send' ] == true) {
                            check.estado_id = 4;
                            check.nombre_estado = "Finalizado";
                        }
                    });

                    this.storage.set( 'visita_tienda_' + this.thisSession[ 'usuario' ].id, JSON.stringify( this.visita_tienda ) )
                    .then( preguntas3 => {
                        this.applicationRef.tick();
                        
                        loading.dismiss();
                        
                        const confirm = this.alert.create({
                            title: 'Éxito',
                            message: "Checklist finalizado correctamente",
                            buttons: [{
                                text: 'Aceptar',
                                handler: () => {
                                    this.navCtrl.pop();
                                }
                            }]
                        });
                        
                        // TRACK DE EVENTO
                        this.firebaseAnalyticsProvider.trackButtonEvent( "FinalizarChecklist" );
                        
                        confirm.present();
                        
                        confirm.onDidDismiss(() => {
                            if ( checklist && global.sendChecklistAtEnding ) {
                                this.refreshIndividualVisit( checklist );
                            }
                        });
                    });
                });
            } else {
                this.util.showAlert( 'Atención', 'Ocurrió un error, por favor intente mas tarde' );
                
                loading.dismiss();
            }
        }
    }


    /**
     * Adapta visitas para formato requerido por API
     * @param visitsToChange
     * @param toSend
     * @returns {Promise<any>}
     */
    async replaceVisit(visitsToChange, toSend) {
        _.forEach(visitsToChange, (visita, key) => {
            if (visita.id == toSend.id) {
                visitsToChange[key] = toSend;
            }
        });
        return visitsToChange;
    }

    /**
     * Trae data guardada en memoria para la visita seleccionada
     * @param checklist
     */
    async getDatafromMemory(checklist) {
        const loading = this.loading.create({ content: 'Obteniendo checklist' });
        loading.present();
        this.storage.get('visita_tienda_' + this.thisSession['usuario'].id).then(async (val) => {
            if (val) this.visita_tienda = JSON.parse(val);

            if (!this.isString) {
                this.checklist = _.find(this.visita_tienda['checklist_visita'], { 'id': checklist * 1 });
                if (_.isUndefined(this.checklist)) {
                    this.checklist = _.find(this.visita_tienda['checklist_visita'], { 'id': checklist + "" });
                    if (_.isUndefined(this.checklist)) {
                        this.checklist = _.find(this.visita_tienda['checklists'], { 'id': checklist * 1 });
                        if (_.isUndefined(this.checklist)) {
                            this.checklist = _.find(this.visita_tienda['checklists'], { 'id': checklist + "" });
                        }
                    }
                }

                this.visita = _.find(this.visita_tienda['visitas'], {
                    'checklist_id': checklist * 1,
                    'sucursal_id': this.sucursal
                });
                if (_.isUndefined(this.visita)) {
                    this.visita = _.find(this.visita_tienda['visitas_respuestas'], {
                        'checklist_id': checklist * 1,
                        'sucursal_id': this.sucursal
                    });
                }
            } else {

                this.visita = _.find(this.visita_tienda['visitas'], {
                    'checklist_id': checklist * 1,
                    'sucursal_id': this.sucursal + ""
                });
                if (_.isUndefined(this.visita)) {
                    this.visita = _.find(this.visita_tienda['visitas'], (visit) => {
                        return (visit.checklist_id == checklist && visit.sucursal_id == this.sucursal + "");
                    });
                }

                if (!_.isUndefined(this.visita) && !_.isNull(this.visita)) {

                    let tempchecklist = _.find(this.visita_tienda['checklist_visita'], {
                        'id': checklist * 1,
                        'visita_id': this.visita['visita_id'] * 1
                    });
                    if (_.isUndefined(tempchecklist) || _.isNull(tempchecklist)) {
                        tempchecklist = _.find(this.visita_tienda['checklist_visita'], {
                            'id': checklist * 1,
                            'visita_id': this.visita['visita_id'] + ""
                        });
                        if (_.isUndefined(tempchecklist) || _.isNull(tempchecklist)) {
                            tempchecklist = _.find(this.visita_tienda['checklist_visita'], {
                                'id': checklist + "",
                                'visita_id': this.visita['visita_id'] * 1
                            });
                            if (_.isUndefined(tempchecklist) || _.isNull(tempchecklist)) {
                                tempchecklist = _.find(this.visita_tienda['checklist_visita'], {
                                    'id': checklist + "",
                                    'visita_id': this.visita['visita_id'] + ""
                                });

                                if (_.isUndefined(tempchecklist) || _.isNull(tempchecklist)) tempchecklist = _.find(this.visita_tienda['checklists'], { 'id': checklist + "" });

                                if (_.isUndefined(tempchecklist) || _.isNull(tempchecklist)) tempchecklist = _.find(this.visita_tienda['checklists'], { 'id': checklist * 1 });
                            }
                        }
                    }

                    this.checklist = tempchecklist;

                } else {
                    this.checklist = _.find(this.visita_tienda['checklists'], { 'id': checklist + "" });
                    if (_.isUndefined(this.checklist)) this.checklist = _.find(this.visita_tienda['checklists'], { 'id': checklist * 1 });
                }
            }
            if (!_.isUndefined(this.visita) && !_.isNull(this.visita) && !_.isUndefined(this.checklist) && !_.isNull(this.checklist)) {
                this.visita_id = this.visita['visita_id'];

                this.checklist['fecha_visita'] = new Date(this.visita['fecha']);
                if (_.isUndefined(this.checklist['nombre_estado']) && !_.isNull(this.checklist['nombre_estado'])) {
                    this.checklist['nombre_estado'] = this.visita['nombre_estado'];
                }
                if (_.isUndefined(this.checklist['estado_id']) || _.isNull(this.checklist['estado_id'])) {
                    this.checklist['estado_id'] = this.visita['estado_id'];
                }

                if (!_.isUndefined(this.visita_tienda['checklist_visita']) && !_.isNull(this.visita_tienda['checklist_visita'])) {

                    let checkVisit = _.find(this.visita_tienda['checklist_visita'], { visita_id: this.visita_id });
                    if (_.isUndefined(checkVisit) || _.isNull(checkVisit)) {
                        var visit_checklist = await this.createChecklistVisit();
                        this.visita_tienda['checklist_visita'].push(visit_checklist)
                        this.storage.set('visita_tienda_' + this.thisSession['usuario'].id, JSON.stringify(this.visita_tienda));
                    }
                } else {
                    let visit_checklist = await this.createChecklistVisit();
                    this.visita_tienda['checklist_visita'] = [];
                    this.visita_tienda['checklist_visita'].push(visit_checklist);
                    this.storage.set('visita_tienda_' + this.thisSession['usuario'].id, JSON.stringify(this.visita_tienda));
                }

                this.numeroPreguntasContestadas(this.checklist).then(ready => {
                    this.checklist['ambitos'].sort(sortBy('id'));
                    this.applicationRef.tick();
                    this.mostrarAmbitos = true;
                    this.mostrarPlantilla = true;
                    this.ready = true;
                    loading.dismiss();
                });
            } else {
                if (!_.isNull(this.checklist['ambitos']) && !_.isUndefined(this.checklist['ambitos']) && this.checklist['ambitos'].length > 0) this.checklist['ambitos'].sort(sortBy('id'));
                this.mostrarPlantilla = true;
                this.ready = true;
                this.iniciarVisita();
                loading.dismiss();
            }
        });
    }

    /**
     * Agrega valores de aplica/no aplica a checklist seleccionado
     * @returns {Promise<{}>}
     */
    async createChecklistVisit() {
        var visit_checklist = this.checklist;
        visit_checklist['visita_id'] = this.visita_id;
        visit_checklist['fecha_visita'] = new Date();
        visit_checklist['estado_id'] = this.visita['estado_id'];
        visit_checklist['nombre_estado'] = this.visita['nombre_estado'];

        _.forEach(visit_checklist['ambitos'], (amb) => {
            _.forEach(amb.preguntas, (preg) => {
                let foundResp = _.find(this.visita_tienda['respuestas'], { visita_id: this.visita_id, pregunta_id: preg.id });
                if (!_.isUndefined(foundResp) && !_.isNull(foundResp) && preg.aplica == 1) {

                    if (foundResp.no_aplica == 1) {
                        preg.hasApply = false;

                        let indexResp = _.indexOf(this.visita_tienda['respuestas'], foundResp);
                        if (indexResp > -1) this.visita_tienda['respuestas'].splice(indexResp, 1);

                        /* _.remove(this.visita_tienda['respuestas'], function(currentObject) {
                             return (currentObject.id === foundResp.id && currentObject.visita_id === foundResp.visita_id);
                         });*/
                    }
                    else if (foundResp.no_aplica == 0) {
                        preg.hasApply = true;
                    }
                }
            });
        });

        return JSON.parse(JSON.stringify(visit_checklist));
    }

    /**
     * Calcula cuantas preguntas del checklist ya fueron respondidas y cuantas aun se encuentran pendientes, según esta información,
     * se actualiza su estado
     * @param checklist
     * @returns {Promise<void>}
     */
    async numeroPreguntasContestadas(checklist) {
        let context = this;
        var contestadas = 0;
        var total = 0;
        let noComents = false;
        _.forEach(checklist.ambitos, function (ambito, key) {
            var respuestas = _.filter(context.visita_tienda['respuestas'], {
                ambito_id: ambito.id + "",
                visita_id: context.visita_id + ""
            });

            if (_.isUndefined(respuestas) || _.isNull(respuestas) || respuestas.length <= 0) respuestas = _.filter(context.visita_tienda['respuestas'], { 'ambito_id': ambito.id + "", 'visita_id': context.visita_id * 1 });

            if (_.isUndefined(respuestas) || _.isNull(respuestas) || respuestas.length <= 0) respuestas = _.filter(context.visita_tienda['respuestas'], { 'ambito_id': ambito.id * 1, 'visita_id': context.visita_id + "" });


            if (_.isUndefined(respuestas) || _.isNull(respuestas) || respuestas.length <= 0) respuestas = _.filter(context.visita_tienda['respuestas'], { 'ambito_id': ambito.id * 1, 'visita_id': context.visita_id * 1 });

            var count = 0;
            var preguntaExiste = [];

            ambito.hasCommentPend = false;
            ambito.has_photo_action = true;

            //Buscamos si existen preguntas con 'no aplica'
            _.forEach(ambito.preguntas, function (pregunta) {
                if (!_.isUndefined(pregunta.hasApply) && !_.isNull(pregunta.hasApply)) {
                    if (pregunta.hasApply == false) {
                        count++;
                    }
                }
            });

            _.forEach(respuestas, function (respuesta) {
                // Buscamos la pregunta asociada a esta respuesta
                let question = _.find(ambito.preguntas, { id: respuesta.pregunta_id });
                if (question) {
                    // Luego la alternativa seleccionada para esta respuesta
                    let alternative = _.find(question.alternativas, { id: respuesta.respuesta_alternativa_id });
                    // Si encontramos la alternativa, al asignamos a la respuesta
                    if (alternative) {
                        respuesta.alternative_selected = alternative;
                    }
                }
                if (!_.isNull(respuesta.no_aplica) && !_.isUndefined(respuesta.no_aplica) && respuesta.no_aplica == 1) {
                    count++;
                } else {
                    if (respuesta.tipo_id == 1) { // Radio
                        if (respuesta.pregunta_alternativa_id == 0 || respuesta.pregunta_alternativa_id == null) {
                            if (respuesta.comentario && respuesta.comentario == 1 && !respuesta.comentarios) {
                                noComents = true;
                                ambito.hasCommentPend = true;
                                ambito.force_incomplete_status = true;
                            } else {
                                if (respuesta.alternative_selected && respuesta.alternative_selected.tipo_id === 3 && (respuesta.texto_adicional == "" || _.isNull(respuesta.texto_adicional) || _.isUndefined(respuesta.texto_adicional))) {
                                    ambito.hasCommentPend = true;
                                    ambito.force_incomplete_status = true;
                                    noComents = true;
                                    //count--;
                                } else {
                                    if (respuesta.alternative_selected && respuesta.alternative_selected.tipo_id === 4 && ((_.isArray(respuesta.foto) ? (!respuesta.foto.length || !respuesta.foto[0].foto) : (!respuesta.foto || !respuesta.foto.foto)))
                                    ) {
                                        ambito.has_photo_action = false;
                                        noComents = true;
                                        ambito.force_incomplete_status = true;
                                    } else {
                                        count++;
                                    }
                                }
                                // Solamente los radio buttons tienen acción con foto
                                // Si no han agregado la foto, se considera incompleta
                                // Aunque primero debemos considerar si viene dentro de un arreglo
                            }
                        }
                    } else if (respuesta.tipo_id == 2) { // Checkbox

                        if (!_.isNull(respuesta.no_aplica) && !_.isUndefined(respuesta.no_aplica) && respuesta.no_aplica == 0) respuesta.checked = true;

                        if (respuesta.alternative_selected && respuesta.checked == true) {

                            // Buscamos si ya se ha ingresado una respuesta para esta pregunta
                            let found_id_question = _.indexOf(preguntaExiste, respuesta.pregunta_id);

                            if ((respuesta.comentario === 1) || (respuesta.alternative_selected.comentario === 1)) {
                                if (respuesta.comentarios) {
                                    if (found_id_question === -1) {
                                        preguntaExiste.push(respuesta.pregunta_id);
                                    }
                                } else {
                                    noComents = true;
                                    ambito.hasCommentPend = true;
                                    ambito.force_incomplete_status = true;
                                    preguntaExiste.splice(found_id_question, 1);
                                }
                            } else {
                                if (found_id_question === -1) {
                                    preguntaExiste.push(respuesta.pregunta_id);
                                }
                            }
                        }
                    } else if (respuesta.tipo_id == 3) { // Texto
                        if ((respuesta.texto_respuesta || respuesta.texto_respuesta === 0) && respuesta.texto_respuesta !== "") {
                            count++;
                        }
                    } else if (respuesta.tipo_id == 4) { // Foto
                        if (respuesta.foto && respuesta.foto.length > 0) {
                            count++;
                        }
                    }
                }
            });

            if (count < 0) count = 0;

            ambito['contestadas'] = count + preguntaExiste.length; // Se le asocia el numero de preguntas contestadas al ambito para mostrarlo en la vista

            if (ambito['contestadas'] > ambito['total']) ambito['contestadas'] = ambito['total'];

            ambito['pendientes'] = ambito['total'] - ambito['contestadas'];
            contestadas += ambito['contestadas'];
            total += ambito['total'];


            if (ambito['contestadas'] == 0) {
                ambito.estado_id = 1;
                ambito.nombre_estado = "Sin contestar";
            }
            if (ambito['contestadas'] > 0 && ambito['contestadas'] < ambito['total']) {
                ambito.estado_id = 2;
                ambito.nombre_estado = "Incompleto";
            }
            if (ambito['contestadas'] >= ambito['total']) {

                if (ambito.hasCommentPend == false && ambito.has_photo_action) {
                    ambito.estado_id = 3;
                    ambito.nombre_estado = "Completo";
                } else {
                    ambito.estado_id = 2;
                    ambito.nombre_estado = "Incompleto";
                }
            }
        });
        if (contestadas == 0) {
            checklist.estado_id = 1;
            checklist.nombre_estado = "Sin contestar";
        }
        if (contestadas > 0 && contestadas < total) {
            checklist.estado_id = 2;
            checklist.nombre_estado = "Incompleto";
        }
        if (contestadas == total) {
            if (noComents == false) {
                checklist.estado_id = 3;
                checklist.nombre_estado = "Completo";
            } else {
                checklist.estado_id = 2;
                checklist.nombre_estado = "Incompleto";
            }
        }
    }

    /**
     * Inicia cuestionarios para visita (cambia su estado y actualiza memoria)
     */
    iniciarVisita() {
        var timeStamp = String(new Date().getTime()); //ID unico necesario para la DB local
        if (this.visita_id == null || this.visita_id == 0) {
            var data = {};
            var visita_id = "local-" + timeStamp;
            var estados = this.visita_tienda['estados_visita'];
            var foundState = {}
            if (!this.isString) {
                foundState = _.find(estados, { 'estado_id': 1 });
            } else {
                foundState = _.find(estados, (status) => {
                    return status.estado_id == "1"
                });
            }
            data = {
                id: visita_id,
                checklist_id: parseInt(this.checklist_id),
                estado_id: 1,
                nombre_estado: foundState['nombre'], // Se le asigna el nombre del estado que viene por DB con el ID seleccionado
                fecha: new Date(),
                modified: true,
                sucursal_id: this.sucursal,
                visita_id: visita_id
            };
            if (_.isUndefined(this.visita_tienda['visitas']) || _.isNull(this.visita_tienda['visitas'])) {
                this.visita_tienda['visitas'] = [];
            }
            this.visita_tienda['visitas'].push(data);

            if (_.isUndefined(this.visita_tienda['checklist_visita']) || _.isNull(this.visita_tienda['checklist_visita']) || !_.isArray(this.visita_tienda['checklist_visita'])) {
                this.visita_tienda['checklist_visita'] = [];
            }

            _.forEach(this.checklist["ambitos"], (ambito) => {
                ambito.estado_id = 1;
                ambito.nombre_estado = foundState['nombre'];
                ambito.pendientes = ambito.total;
                ambito.contestadas = 0;

                _.forEach(ambito.preguntas, (pregunta) => {
                    if (!_.isUndefined(pregunta.hasApply)) {
                        pregunta.hasApply = undefined;
                    }
                });

            });
            var visit_checklist = this.checklist;
            visit_checklist['visita_id'] = visita_id;
            visit_checklist['fecha_visita'] = new Date();
            visit_checklist['estado_id'] = 1;
            visit_checklist['nombre_estado'] = foundState['nombre'];

            this.visita_tienda['checklist_visita'].push(visit_checklist);
            this.storage.set('visita_tienda_' + this.thisSession['usuario'].id, JSON.stringify(this.visita_tienda));
            this.visita_id = visita_id;
            this.mostrarAmbitos = true;
        }
    }

    /**
     * Redireccion hacia vista de detalle
     * @param checklist_id
     * @param ambito_id
     * @param estado
     */
    navigateToDetalle( checklist_id, ambito_id, estado_id ) {
        if (!_.isUndefined( this.navParams.data.visita ) && !_.isNull( this.navParams.data.visita ) ) {
            this.navCtrl.push( DetallePage, {
                sucursal_id: this.sucursal,
                checklist_id: checklist_id,
                visita_id: this.visita_id,
                ambito_id: ambito_id,
                visita: true,
                fromStats: this.fromStats
            });
        } else {
            // viajo desde acá
            if ( this.onlyWatch == false ) {
                this.navCtrl.push( DetallePage, {
                    checklist_id: checklist_id,
                    ambito_id: ambito_id,
                    estado_id: estado_id,
                    fromStats: this.fromStats
                });
            } else {
                // para viajar con el onliwash
                this.navCtrl.push( DetallePage, {
                    checklist_id: checklist_id,
                    ambito_id: ambito_id,
                    estado_id: estado_id,
                    suc_id: this.suc_id != 0 ? this.suc_id : null,
                    user_id: this.user_id != 0 ? this.user_id : null,
                    onlyWatch: true,
                    fromStats: this.fromStats
                });

            }
        }
    }

    showVisitActionSheet() {
        const actionSheet = this.actionSheet.create({
            buttons: [
                {
                    text: 'Inicio',
                    handler: () => {
                        this.navCtrl.popToRoot();
                    }
                }, {
                    text: 'No enviados',
                    handler: () => {
                        this.navCtrl.push('NoEnviadasPage');
                    }
                }, {
                    text: 'Históricos',
                    handler: () => {
                        this.navCtrl.push('HistoricasPage');
                    }
                }
            ]
        });
        actionSheet.present();
    }

    getVisitCommentary(checklistId: any, branchOfficeId: any) {
        if (checklistId && branchOfficeId) {
            let params: string = ('?check_id=' + checklistId + '&sucursal_id=' + branchOfficeId);
            this.request
                .get(config.endpoints.get.commentary + params, true)
                .then((response: any) => {
                    if (response && response.data && response.data[0]) {
                        this.commentary = response.data[0];
                    }
                })
                .catch((error: any) => { });
        }

    }

    refreshIndividualVisit(visita) {

        let allVisits = this.visita_tienda['visitas'];
        let allAnswers = this.visita_tienda['respuestas'];

        if (allVisits && allAnswers) {
            let visits = _.filter(allVisits, { id: visita.visita_id });
            let answers = _.filter(allAnswers, { visita_id: visita.visita_id });
            this.sendOfflineData(visits, answers, 'individual', visita);
        }
    }


    async sendOfflineData(visitas, respuestas, update, visit) {

        let visitasTotales = visitas;
        let arreglo_visitas = _.filter(visitasTotales, { 'modified': true });
        let arreglo_respuestas = _.filter(respuestas, { 'modified': true });

        this.util.updateVisitResps(arreglo_respuestas, visit).then(async value => {

            let temp_respuestas = value;

            let sendResp = _.concat(arreglo_respuestas, JSON.parse(JSON.stringify(temp_respuestas)));
            var params = {
                data: {
                    visitas_respuestas: arreglo_visitas,
                    respuestas: sendResp
                }
            };
            let data = {};
            await this.request
                .post(config.endpoints.post.refresh, params, false)
                .then((response: any) => {
                    if (response.status === true) {
                        this.getAllInfo();
                    } else {
                        this.util.showAlert("Atención", "No ha sido posible enviar los checklists, intenta nuevamente utilizando el botón para refrescar en la vista de Check-In.");
                    }
                })
                .catch((error: any) => { });
            return data;
        });
    }

    async getAllInfo() {
        var endpoint = "?zona_id=&tipo=usuario";
        await this.request
            .get(config.endpoints.get.refreshOfflineGet + endpoint, false)
            .then((response: any) => {
                try {
                    if (response.code == 200) {
                        if (!_.isUndefined(response.data) && !_.isNull(response.data)) {
                            if (!_.isUndefined(response.data.sucursales_sin_responder) && !_.isNull(response.data.sucursales_sin_responder)) {


                                let arr: any = [];

                                _.forEach(response.data.sucursales_sin_responder.visitas_respuestas, (visit) => {
                                    if (visit.estado_id !== 4) {
                                        visit.modified = true;
                                        let visit_checklist = _.find(response.data.sucursales_sin_responder.checklists, { id: visit.checklist_id });
                                        if (visit_checklist) visit.checklist = visit_checklist;
                                        arr.push(visit);
                                    }
                                });

                                let visita_tienda = {
                                    sucursales: response.data.sucursales_sin_responder.sucursales,
                                    zonas: response.data.sucursales_sin_responder.zonas,
                                    checklists: response.data.sucursales_sin_responder.checklists,
                                    visitas_respuestas: response.data.sucursales_sin_responder.visitas_respuestas,
                                    respuestas: response.data.sucursales_sin_responder.respuestas,
                                    estados_visita: response.data.sucursales_sin_responder.estado_visita,
                                    visitas: arr
                                };

                                visita_tienda['fechaActualizacion'] = new Date();
                                this.storage.set('visita_tienda_' + this.thisSession['usuario'].id, JSON.stringify(visita_tienda));
                            }
                        }
                    }
                } catch (e) { }
            })
            .catch((error: any) => { });
    }

    downloadFile(url: string) {
        let options: InAppBrowserOptions = { location: 'no', };
        let browser = this.browser.create(url, '_system', options);
    }

    openSignatureDrawer() {
        // le enviamos al modal el checklist_id para ligar la firma con su checklist
        let modal = this.modal.create(SignatureViewerComponent, { checklist_id: this.checklist_id });

        modal.present();

        modal.onDidDismiss((data) => {
            this.refreshChecklist(this.checklist_id);
            this.signatureImg = data.image;
        });
    }
}
