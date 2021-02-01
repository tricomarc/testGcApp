import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, LoadingController, Content, ViewController } from 'ionic-angular';
import { TaskConfirmationComponent } from '../task-confirmation/task-confirmation';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { FormControl } from '@angular/forms';
import { RequestProvider } from '../../../../shared/providers/request/request';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { SessionProvider } from '../../../../shared/providers/session/session';

/**
 * Generated class for the TaskManagerPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'task-users',
  templateUrl: 'task-users.html',
})
export class TaskUsersComponent {

  @ViewChild(Content) content: Content;

  private users: any[] = [];
  private params: { page: number; pageSize: number; q: string } = {
    page: 0,
    pageSize: 20,
    q: ''
  };
  private searchControl = new FormControl();
  private userId: number = null;

  private searchControlSubscription: Subscription = null;
  private scrollControlSubscription: Subscription = null;

  private previousSelectedUsers: any[] = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private loadingController: LoadingController,
    private viewController: ViewController,
    private utilProvider: UtilProvider,
    private requestProvider: RequestProvider) {
  }

  async ionViewDidLoad() {
    this.previousSelectedUsers = this.navParams.data.users;

    try {
      this.userId = parseInt(SessionProvider.state.value.userId);
    } catch (e) { }

    this.subscribeSearch();
    this.subscribeScroll();

    const loading = this.loadingController.create({ content: 'Cargando usuarios...' });
    loading.present();
    await this.getUsers();
    loading.dismiss();
  }

  ionViewWillLeave() {
    try {
      this.searchControlSubscription.unsubscribe();
    } catch (e) { }

    try {
      this.scrollControlSubscription.unsubscribe();
    } catch (e) { }
  }

  next() {
    const users: any[] = this.users.filter((f: any) => f.selected);

    if (!users || !users.length) {
      this.utilProvider.showToast('Seleccione al menos un usuario.', 3000);
      return;
    }

    this.viewController.dismiss({ selectedUsers: users });
  }

  async getUsers() {

    if (!this.userId) {
      this.utilProvider.showToast('No fue posible obtener la lista de usuarios.', 3000);
      return;
    }
    let store = this.navParams.get('store');

    let query = `/task/users?usuarioId=${this.userId}`;
    if(store){
      query += `&sucursalId=[${store}]`;
    }
    query += `&page=${this.params.page}&perPage=${this.params.pageSize}&search=${this.params.q}`


    await this.requestProvider.getMicroService(query)
      .then((response: any) => {

        if (response.data && response.data.pagination && response.data.pagination.err) {
          if (this.params.page) {
            this.params.page = this.params.page - 1;
          }
        }

        if (response.data && _.isArray(response.data.results)) {
          response.data.results.forEach((u: any) => {

            // Consideramos el usuario solamente si no existe en la lista de usuarios
            if (!_.find(this.users, { id: u.id })) {

              // Cada vez que agregamos un usuario, verificamos si viene desde el arreglo anterior (previamente seleccionado)
              const previousUser = _.find(this.previousSelectedUsers, (pu) => pu.id === u.id);

              // Si viene, asignamos los valores ya ingresados por el usuario en la vista anterior
              if (previousUser) {
                u.selected = previousUser.selected;
                // También lo eliminamos para no volver a asignar estos valores.
                _.remove(this.previousSelectedUsers, (pu) => pu.id === previousUser.id);

              }
              // Si no, simplemenete ponemos los valores por defecto
              else {
                u.selected = false;
              }
              this.users.push(u);
            }
          });
        }
      })
      .catch((error) => {
        this.utilProvider.showToast('No fue posible obtener la lista de usuarios.', 3000);
      });
  }

  subscribeSearch() {
    this.searchControlSubscription = this.searchControl.valueChanges
      .debounceTime(300) // Cuando se deja de tipear por 300 ms
      .distinctUntilChanged() // Si el input es distinto
      .subscribe(async (searchTerm: any) => {
        this.resetUsers();
        this.params.q = searchTerm;
        this.getUsers();
      });
  }

  resetUsers() {
    this.params.page = 0;
    this.params.pageSize = 20;
    this.params.q = '';
    _.remove(this.users, (u: any) => {
      return !u.selected;
    });
  }

  async refreshUsers(event: any) {
    this.users = [];
    this.resetUsers();
    await this.getUsers();
    event.complete();
  }

  subscribeScroll() {
    this.scrollControlSubscription = this.content.ionScrollEnd.subscribe(async (event: any) => {
      if (!event) return;
      if ((event.scrollTop + this.content.getContentDimensions().contentHeight) > this.content.getContentDimensions().scrollHeight) {
        this.params.page += 1;
        const loading = this.loadingController.create({ content: 'Cargando usuarios...' });
        loading.present();
        await this.getUsers();
        loading.dismiss();
      }
    });
  }

  close() {
    const users = this.users.filter((u) => u.selected);
    this.viewController.dismiss({ selectedUsers: users });
  }
}
