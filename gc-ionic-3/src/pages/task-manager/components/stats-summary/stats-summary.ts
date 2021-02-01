import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, OnDestroy, Input } from '@angular/core';

import * as _ from 'lodash';
import * as round from 'round10';

import { IStatsSummary } from '../../models/stats-summary.interface';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { Events, NavController } from 'ionic-angular';
import { TaskAssignmentListComponent } from '../task-assignment-list/task-assignment-list';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { BehaviorSubject, Subscription } from 'rxjs';

/**
 * Generated class for the TaskManagerPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'stats-summary',
  templateUrl: 'stats-summary.html',
})

export class StatsSummaryComponent implements OnInit, OnDestroy {

  @ViewChild('success') success: ElementRef;
  @ViewChild('primary') primary: ElementRef;
  @ViewChild('secondary') secondary: ElementRef;
  @ViewChild('dark') dark: ElementRef;
  @ViewChild('positive') positive: ElementRef;
  @ViewChild('energized') energized: ElementRef;
  @ViewChild('danger') danger: ElementRef;
  @ViewChild('stable') stable: ElementRef;
  @ViewChild('calm') calm: ElementRef;
  @ViewChild('balanced') balanced: ElementRef;
  @ViewChild('assertive') assertive: ElementRef;
  @ViewChild('royal') royal: ElementRef;
  @ViewChild('default') default: ElementRef;
  @ViewChild('light') light: ElementRef;

  @Output() onStats = new EventEmitter<any>();
  @Input() data: any = null;
  @Input() fromDash: boolean = false;
  @Input() dateSubject: BehaviorSubject<any>;

  private dateSubscriber: Subscription;
  private

  private summaries: IStatsSummary[] = [];
  private total: number = 0;
  private loading: boolean = true;
  private colors: { class: string; rgb: string }[] = [];
  private userId: number = null;


  private filters: any = { from: null, to: null };

  constructor(
    private events: Events,
    private navController: NavController,
    private requestProvider: RequestProvider,
    private utilProvider: UtilProvider) { }

  ngOnDestroy() {
    this.events.unsubscribe('NEW_ASSIGNMENT');

    if (this.dateSubscriber) {
      try {
        this.dateSubscriber.unsubscribe();
      } catch (e) { }
    }
  }

  async ngOnInit() {
    console.log('EN  modulo')
    try {
      this.userId = parseInt(SessionProvider.state.value.userId);
    } catch (e) { }

    this.events.subscribe('NEW_ASSIGNMENT', () => {
      if (!this.data) this.getSummaries();
    });

    this.events.subscribe('TASK_TDA_REFRESH', (data: any) => {
      if (data.event && !this.data) this.getSummaries(data.event);
    });


    this.setColors();
    if (!this.data) this.getSummaries();
    else {
      this.total = this.data.totalTareasEstado;
      
      this.summaries = _.orderBy(
        this.data.estadistica.map((d) => {
          let percentage: string = `${round.round10((d.total * 100) / this.data.totalTareasEstado, -1)}`;
          return {
            id: d.id,
            name: d.nombre,
            color: this.getRGB(d.color),
            quantity: d.total,
            percentage: `${percentage}%`,
            order: d.orden
          }
        }),
        'order', 'asc');

      _.delay(() => {
        this.loading = false;
      }, 1000);
    }

    if (this.dateSubject) {
      try {
        this.dateSubscriber = this.dateSubject.subscribe((data: any) => {
          if (data && data.from && data.to) {
            this.filters = data;
            this.getSummaries(null, data);
          }
        });
      } catch (e) { }
    }
  }

  async getSummaries(event?: any, dates?: any) {

    if (!dates) {
      // Obtenemos los filtros de fecha (primer día del mes hasta el día actual)
      let to = new Date();
      let from = new Date(to.getFullYear(), to.getMonth(), 1);
      dates = {
        from: (this.utilProvider.getFormatedDate(from)),
        to: (this.utilProvider.getFormatedDate(to))
      }

      this.filters = dates;
    }
    let query = this.getDateFilter(dates);
    if (dates.filter) {
      query += `&tipo=${dates.filter}`;
    }
    await this.requestProvider.getMicroService('/task/statistics?usuarioId=' + this.userId + query)
      .then((response: any) => {
        console.log(response);
        if (
          response &&
          response.data &&
          response.data.tareas &&
          response.data.asignados
        ) {
          this.total = response.data.asignados;
          this.summaries = _.orderBy(
            response.data.tareas.map((t: any) => {

              let percentage: string = `${round.round10((t.total * 100) / this.total, -1)}`;

              return {
                id: t.id,
                name: t.nombre,
                color: this.getRGB(t.color),
                quantity: t.total,
                percentage: `${percentage}%`,
                order: t.orden
              };
            }),
            'order', 'asc');
        } else {
          this.total = 0;
          this.summaries = [];
        }

        this.onStats.next({
          stats: {
            total: this.total,
            summaries: this.summaries
          }
        });

      })
      .catch((error) => {
        this.utilProvider.showToast('No fue posible obtener las estadísticas.', 3000);
      });

    if (event) event.complete();
    this.loading = false;
  }

  /**
   * Crea una arreglo con elementos del HTML que contienen los colores
   * que pueden llegar a través de la api.
   * 
   * Cada elemento tiene el color en la propiedad background-color
   * 
   * Si se obtiene el color del elemento exitosamente, se agrega al arreglo
   * de colores de esta clase.
   */
  setColors() {

    const colors = [
      { class: 'success', elm: this.success },
      { class: 'primary', elm: this.primary },
      { class: 'secondary', elm: this.secondary },
      { class: 'light', elm: this.light },
      { class: 'calm', elm: this.calm },
      { class: 'balanced', elm: this.balanced },
      { class: 'dark', elm: this.dark },
      { class: 'stable', elm: this.stable },
      { class: 'positive', elm: this.positive },
      { class: 'energized', elm: this.energized },
      { class: 'assertive', elm: this.assertive },
      { class: 'royal', elm: this.royal },
      { class: 'default', elm: this.default },
      { class: 'danger', elm: this.danger }
    ];

    colors.forEach((c) => {
      if (c.elm) {
        const styles = window.getComputedStyle(c.elm.nativeElement);
        this.colors.push({
          class: c.class,
          rgb: styles.backgroundColor
        });
      }
    });
  }

  /**
   * 
   * @param cls
   * Retorna un color en RGB a partir de una class
   */
  getRGB(cls: string): string {
    for (let c of this.colors) {
      if (c.class === cls) return c.rgb;
    }
    return 'rgb(0, 0, 0)';
  }

  onClick(summary: any) {
    if (summary.quantity) {
      this.navController.push(TaskAssignmentListComponent, { estadoId: summary.id, summaries: this.summaries, filters: this.filters });
    }
  }

  getDateFilter(dates: any) {
    console.log('dates', dates);
    return `&from=${dates.from}&to=${dates.to}`;
  }
}
