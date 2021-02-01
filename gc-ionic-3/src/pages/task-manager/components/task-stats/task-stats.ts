import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavController, NavParams, Events } from 'ionic-angular';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { BehaviorSubject } from 'rxjs';


@Component({
  selector: "task-stats",
  templateUrl: "task-stats.html",
})
export class TaskStatsComponent implements OnInit, OnDestroy {
  private chartObject: any = null;

  private filters: any = null;
  private dateSubject: BehaviorSubject<any> = new BehaviorSubject({});
  private typeTask: number = 0;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public events: Events,
    private utilProvider: UtilProvider) { }


  ngOnDestroy() {
    this.events.unsubscribe('TASK_TDA_REFRESH');
    this.events.unsubscribe('TASK_TDA_BOTTOM_SCROLL');
  }

  ngOnInit() {

    // Obtenemos los filtros de fecha (primer día del mes hasta el día actual)
    let to = new Date();
    let from = new Date(to.getFullYear(), to.getMonth(), 1);
    let filters: any = this.navParams.data.filters;

    // Definimos los filtros
    this.filters = {
      from: ((filters && filters.from) ? filters.from : this.utilProvider.getFormatedDate(from)),
      to: ((filters && filters.to) ? filters.to : this.utilProvider.getFormatedDate(to)),
      zoneId: ((this.navParams.data.zona_id) ? this.navParams.data.zona_id : null),
      nivel: 'dual',
      checklists: []
    };

    this.events.subscribe('TASK_TDA_REFRESH', (data: any) => {
      if (data.event) data.event.complete();
    });

    this.events.subscribe('TASK_TDA_BOTTOM_SCROLL', async () => { });
  }

  onStats(data: any) {

    if (!data || !data.stats || !data.stats.summaries) return;

    const dataTable = [["Tareas", "Estados"]];
    const colors = [];

    data.stats.summaries.forEach((s: any) => {
      dataTable.push([s.name, s.quantity]);
      colors.push(s.color);
    });

    this.chartObject = {
      chartType: "PieChart",
      dataTable: dataTable,
      options: { title: "Tareas", colors: colors },
    };
  }

  changeDateFilters(event: any) {
    this.dateSubject.next({ from: this.filters.from, to: this.filters.to });
  }

  getTaskFilter(){
    let type = null;
    if(this.typeTask == 0){
      type = null;
    }
    if(this.typeTask == 1){ 
      type = ('SIMPLE');
    }
    if(this.typeTask == 2){ 
      type = ('NUMERICA');
    }

    this.dateSubject.next({ from: this.filters.from, to: this.filters.to, filter: type  })
  }

}