import {ApplicationRef, Component, ViewChild, NgModule, LOCALE_ID} from '@angular/core';
import {
    AlertController,
    Content,
    Events,
    IonicPage,
    LoadingController,
    MenuController,
    NavController,
    NavParams,
    Slides
} from 'ionic-angular';
import {Storage} from '@ionic/storage';
import * as _ from 'lodash';
import {SessionProvider} from "../../../../shared/providers/session/session";
import {global} from '../../../../shared/config/global'
import {UtilProvider} from "../../../../shared/providers/util/util";
import {config} from "../../visita.config";
import {RequestProvider} from "../../../../shared/providers/request/request";
import {VisitaDetallePage} from "../historicas/sub-pages/visita-detalle/visita-detalle";
import {D} from "@angular/core/src/render3";

/**
 * Generated class for the FinalizadasPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'asignacion',
    templateUrl: 'asignacion.html',
})
export class AsignacionPage {

    /*@ViewChild(Content) content: Content;*/
    @ViewChild(Slides) private slider: Slides;
    numbers = [0, 1, 2];
    visita_id = null;
    checklist: {};
    monthdays = [];
    weekdays = [];
    firstLoad: boolean = true;
    ready: boolean = false;
    selectedDay: Date = new Date();
    initDay: Date = new Date();
    endDay: Date = new Date();

    actualView = 1;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private isFirstLoad: boolean = true;

    eventSource;
    viewTitle;

    isToday: boolean;
    calendar = {
        locale: 'es-CL',
        mode: 'week',
        startingDayWeek: 1,
        currentDate: new Date(),
        dateFormatter: {
            formatMonthViewDay: function (date: Date) {
                return date.getDate().toString();
            },
            formatMonthViewDayHeader: function (date: Date) {
                return 'MonMH';
            },
            formatMonthViewTitle: function (date: Date) {
                return 'testMT';
            },
            formatWeekViewDayHeader: function (date: Date) {
                return 'MonWH';
            },
            formatWeekViewTitle: function (date: Date) {
                return 'testWT';
            },
            formatWeekViewHourColumn: function (date: Date) {
                return 'testWH';
            },
            formatDayViewHourColumn: function (date: Date) {
                return 'testDH';
            },
            formatDayViewTitle: function (date: Date) {
                return 'testDT';
            },
        }
    };

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private menu: MenuController,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private alert: AlertController) {
    }

    ionViewWillEnter() {
        this.menu.enable(false, "menu");
        this.changeMode('month')
    }

    async loadEvents() {
        this.eventSource = await this.loadVisits();
        if (this.calendar.mode == 'week') {
            var first = 0;
            if (this.selectedDay.getDay() == 0) first = (this.selectedDay.getDate() - this.selectedDay.getDay() - 7); // First day is the day of the month - the day of the week
            else first = this.selectedDay.getDate() - this.selectedDay.getDay(); // First day is the day of the month - the day of the week
            this.weekdays = [];
            var newWeek = [];
            for (let i = 1; i <= 7; i++) {
                let newday = first + i;
                let tempDay = new Date(this.selectedDay).setDate(newday);
                let newdayDate = new Date(tempDay).toUTCString();
                this.weekdays.push(newdayDate)
            }
            this.weekdays.forEach(async (day) => {
                var newObject = {
                    date: new Date(day),
                    visits: []
                };
                newObject.visits = _.filter(this.eventSource, function (i) {
                    return i.startTime.getDate() + "-" + (i.startTime.getMonth() + 1) + "-" + i.startTime.getFullYear() == newObject.date.getDate() + "-" + (newObject.date.getMonth() + 1) + "-" + newObject.date.getFullYear();

                });
                newWeek.push(newObject)
            });
            this.weekdays = newWeek;
        }
    }

    onViewTitleChanged(title) {
        this.viewTitle = this.capitalizeFirstLetter(title);
    }

    /**
     * Seleccion de evento para cambio de fecha
     * @param event
     */
    onEventSelected(event) {
        let today = new Date();
        let compareDate = new Date(event.startTime);
        today.setHours(0, 0, 0, 0)
        compareDate.setHours(0, 0, 0, 0)
        if (today <= compareDate) {
            let alert = this.alert.create({
                title: 'Cambio de Horario para visita a ' + event.title,
                subTitle: '',
                message: 'Nueva Fecha',
                cssClass: 'alert-style',

                buttons: [{
                    text: 'Cancelar',
                    handler: () => {
                    }
                },
                    {
                        text: 'Reagendar',
                        handler: data => {
                            var params = {
                                "asignacion_id": event.id,
                                "fecha": data[0],
                                "comentario": data[1],
                            };
                            if (data[0] == "" || data[1] == "") {
                                this.util.showAlert('Atención', 'Debe completar todos los campos para realizar un cambio de asignación.');
                            } else {
                                const loading = this.loading.create({content: 'Actualizando Información'});
                                loading.present();
                                this.request
                                    .post(config.endpoints.post.editCalendarVisits, params, true)
                                    .then((response: any) => {
                                        loading.dismiss();
                                        if (response.code == 200) {
                                            let alert = this.alert.create({
                                                title: 'Atención',
                                                subTitle: response.message,
                                                buttons: [{
                                                    text: 'OK',
                                                    handler: () => {
                                                        this.loadEvents();
                                                    }
                                                }],
                                            });
                                            alert.present();
                                        } else {
                                            this.util.showAlert('Atención', 'Atención ' + response.code + '. ' + response.message);
                                        }

                                    })
                                    .catch((error: any) => {
                                        loading.dismiss();
                                        this.util.showAlert('Atención', 'No ha sido posible enviar los datos.');
                                    });
                            }
                        }
                    }]
            });
            alert.addInput({
                type: 'date',
                label: 'Nueva Fecha',
                value: "",
                placeholder: 'Ingrese Nueva Fecha'
            });
            alert.addInput({
                type: 'text',
                label: 'Motivo',
                value: "",
                placeholder: 'Motivo'
            });
            alert.present();

        } else {
            this.util.showToast("No se puede seleccionar una visita con fecha menor a hoy.", 3000);
        }
    }

    /**
     * Cambio de tipo de visualización (mes, semana o dia)
     * @param mode
     */
    changeMode(mode) {
        this.calendar.mode = mode;
        //En vista de semana y mes, se deben cargar todos los dias asociados
        if (mode == 'month') {
            this.firstLoad = true;
            this.numbers = [0, 1, 2];

            var date = new Date(this.selectedDay.getFullYear(), this.selectedDay.getMonth(), 1);
            this.monthdays = [];
            while (date.getMonth() === this.selectedDay.getMonth()) {
                this.monthdays.push(date.toUTCString());
                date.setDate(date.getDate() + 1);
            }
            this.initDay = new Date(this.monthdays[0]);
            this.endDay = new Date(this.monthdays[(this.monthdays.length - 1)]);
        } else if (mode == 'week') {
            var first = 0;
            if (this.selectedDay.getDay() == 0) first = (this.selectedDay.getDate() - this.selectedDay.getDay() - 7); // First day is the day of the month - the day of the week
            else first = this.selectedDay.getDate() - this.selectedDay.getDay(); // First day is the day of the month - the day of the week
            this.weekdays = [];
            for (let i = 1; i <= 7; i++) {
                let newday = first + i;
                let tempDay = new Date(this.selectedDay).setDate(newday);
                let newdayDate = new Date(tempDay).toUTCString();
                this.weekdays.push(newdayDate);
            }
            this.initDay = new Date(this.weekdays[0]);
            this.endDay = new Date(this.weekdays[6]);
            this.viewTitle = "Semana del " + this.initDay.getDate() + "-" + (this.initDay.getMonth() + 1) + "-" + this.initDay.getFullYear() + " a " + this.endDay.getDate() + "-" + (this.endDay.getMonth() + 1) + "-" + this.endDay.getFullYear()
        }/* else if (mode == 'day') {
            //En vista de dia se asigna la fecha seleccionada como inicio y final
            this.initDay = this.selectedDay;
            this.endDay = this.selectedDay;
            this.viewTitle = "Dia " + this.selectedDay.getDate() + "-" + (this.selectedDay.getMonth() + 1) + "-" + this.selectedDay.getFullYear();
        }*/
        this.loadEvents();
        return true;
    }

    /*today() {
        this.calendar.currentDate = new Date();
    }*/

    onTimeSelected(ev) {
        if (this.calendar.mode == "month") {
            let newDay = new Date(ev.selectedTime);
            let compareDate1 = newDay.getFullYear() + "-" + (newDay.getMonth() + 1) + "-" + newDay.getDate();
            let compareDate2 = this.selectedDay.getFullYear() + "-" + (this.selectedDay.getMonth() + 1) + "-" + this.selectedDay.getDate();
            let month1 = newDay.getMonth() + 1;
            let month2 = this.selectedDay.getMonth() + 1;
            if (compareDate1 != compareDate2) this.selectedDay = newDay;
            if (month1 != month2){
                this.changeMode(this.calendar.mode);
            }
        }
    }

    /**
     * Seleccion de fecha, en caso de que la fecha no sea igual a la seleccionada anteriormente, se cargan las visitas asignadas a ese dia
     * @param {Date} event
     */
    onCurrentDateChanged(event: Date) {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        event.setHours(0, 0, 0, 0);
        this.isToday = today.getTime() === event.getTime();


        /* Cuando carga la vista se ejecuta el método changeMode,
        el cual activa este método al cambiar el valor de currentDate, por ende la data se carga dos veces,
        esta condición soluciona este problema. */
        if(this.isFirstLoad) {
            this.isFirstLoad = false;
            return;
        }

        // Obtenemos la fecha con el primer día del mes de la fecha del evento
        let temp = new Date(event.getFullYear(), event.getMonth(), 1);

        // Si el timestamp de la fecha actual del calendario es distinto al del evento
        if(this.calendar.currentDate.getTime() !== temp.getTime()) {
            // Decimos que se ha cambiado el mes del calendario
            // Igualamos la fecha seleccionada del calendario a la del evento (evita loop)
            this.selectedDay = temp;
            this.calendar.currentDate = temp;
            // Obtenemos los nuevos eventos
            this.changeMode('month');
        }
    }

    onRangeChanged(ev) {
    }

    /**
     * Carga visitas asociadas a rango de fechas seleccionado
     * @returns {Promise<{}>}
     */
    async loadVisits() {
        let events = [];
        const loading = this.loading.create({content: 'Obteniendo Infomación'});
        loading.present();
        var endpoint = "?desde=" + this.initDay.getFullYear() + "-" + (this.initDay.getMonth() + 1) + "-" + this.initDay.getDate() + "&hasta=" + this.endDay.getFullYear() + "-" + (this.endDay.getMonth() + 1) + "-" + this.endDay.getDate();
        await this.request
            .get(config.endpoints.get.calendarVisits + endpoint, true)
            .then((response: any) => {
                try {
                    if (response.code == 200) {

                        response.data.forEach(async (visit) => {
                            var initDate = new Date(visit.fecha);
                            events.push({
                                id: visit.id,
                                title: visit.sucursal.nombre,
                                startTime: initDate,
                                endTime: new Date(initDate.getFullYear(), initDate.getMonth(), initDate.getDate(), 21, 59),
                                allDay: false,
                                state: visit.estado_checkin.codigo
                            });
                        });

                    } else {
                        this.util.showToast(response.message, 3000);
                    }
                }
                catch (e) {
                }
                loading.dismiss();
            })
            .catch((error: any) => {
                loading.dismiss();
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        return events;
    }

    /**
     * Actualiza fechas para carga de anterior semana o día
     * @param type
     */
    lastDayWeek(type) {
        if (type == 'week') {
            this.selectedDay.setDate(this.selectedDay.getDate() - 7)
            this.weekdays = [];
        } /*else if (type == 'day') {
            this.selectedDay.setDate(this.selectedDay.getDate() - 1)
        }*/
        this.changeMode(type)
    }

    /**
     * Actualiza fechas para carga de siguiente semana o día
     * @param type
     */
    nextDayWeek(type) {
        if (type == 'week') {
            this.selectedDay.setDate(this.selectedDay.getDate() + 7)
            this.weekdays = [];
        } /*else if (type == 'day') {
            this.selectedDay.setDate(this.selectedDay.getDate() + 1)
        }*/
        this.changeMode(type)
    }

    /**
     * Avanza a anterior pagina de semana o día
     */
    loadPrevWeek() {
        this.weekdays = [];
        this.eventSource = [];
        let newIndex = this.slider.getActiveIndex();
        this.actualView = newIndex;
        newIndex++;
        this.numbers.unshift(this.numbers[0] - 1);
        this.numbers.pop();
        // Workaround to make it work: breaks the animation
        this.slider.slideTo(newIndex, 0, false);
        this.lastDayWeek(this.calendar.mode)
    }

    /**
     * Avanza a siguiente pagina de semana o día
     */
    loadNextWeek() {
        if (this.firstLoad) {
            // Since the initial slide is 1, prevent the first
            // movement to modify the slides
            this.firstLoad = false;
            return;
        }
        this.weekdays = [];
        this.eventSource = [];
        let newIndex = this.slider.getActiveIndex();
        this.actualView = newIndex;
        newIndex--;
        this.numbers.push(this.numbers[this.numbers.length - 1] + 1);
        this.numbers.shift();
        // Workaround to make it work: breaks the animation
        this.slider.slideTo(newIndex, 0, false);
        this.nextDayWeek(this.calendar.mode)
    }

    /*toChangeSlide() {
    }*/

    /**
     * Cambia a mayusculas la primera letra de un texto
     * @param string
     * @returns {string}
     */
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}
