import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, LoadingController } from 'ionic-angular';
import { NoImplementarModel } from './no-implementar.model';
import { config } from './no.implementar.config';
import { UtilProvider } from '../../../shared/providers/util/util';
import { RequestProvider } from '../../../shared/providers/request/request';

@IonicPage()
@Component({
  selector: 'page-modal-no-implementar',
  templateUrl: 'modal-no-implementar.html',
})
export class ModalNoImplementarPage {

  causasModel: NoImplementarModel = new NoImplementarModel();
  checkedText = {texto: null, id: 0}
  constructor(public navCtrl: NavController,
    private util: UtilProvider,
    private request: RequestProvider,
    private viewCtrl: ViewController,
    private loadingCtrl: LoadingController,
    public navParams: NavParams) {

  }

  ionViewDidEnter(){
    var param = this.navParams.get('params');
    var causasMod = new NoImplementarModel(param);
    causasMod.causas.forEach((item) => { if(item.isChecked) this.checkedText = {texto: null, id: item.id}  })
    this.causasModel = causasMod;
  }

  closeModal(){
    this.viewCtrl.dismiss();
  }

  save(){
    var params = {"reporte_id": this.causasModel.reporteId, "causas": [] };
    var textoValido = true;

    if(this.causasModel.causaUnica){ //radio
      // console.log(this.checkedText)
      const idConTexto = this.causasModel.causasTextoId;
      var causaItem = null;

      this.causasModel.causas.forEach((causa) => {
        if(causa.id == this.checkedText.id){ // Item marcado
          causaItem = causa; // Causa unica seleccionada 
          idConTexto.forEach((id) => { // Id de causas que solicitan Texto
            if(id == this.checkedText.id){ // Si el item seleccionado pertenece a una causa que solicita texto
              if((!causa.texto || causa.texto == null || causa.texto.trim() == '')){
                textoValido = false;
              }
            } 
          });
        }
      })


      params.causas.push({ //inserta los parametros para el request
      "id": this.checkedText.id,
      "texto": causaItem['texto']});
      

    }else{ //checkbox
      
      const check = this.causasModel.causas;
      const idConTexto = this.causasModel.causasTextoId;
      check.forEach((item) => {
        if(item.isChecked){// Item Checkeados
          params.causas.push({"id": item.id, "texto": item.texto});

          idConTexto.forEach((i) => { // Id de causas que solitan texto
            if(item.id == i){ // Si el id marcado pertenece a un id de item que solicita texto
              if(!item.texto || item.texto == null || item.texto.trim() == ''){
                textoValido = false;
              }
            }
          });
        }
      });  
    }

    if(params.causas.length == 0){
      this.util.showAlert('Alerta', 'Debes seleccionar al menos una causa');
      return;
    }
    if(!textoValido){
      this.util.showAlert('Alerta', 'Debes completar todos los campos de texto solicitados');
      return;
    }

    const loading = this.loadingCtrl.create({});
    loading.present();
    this.request.post(config.post.NoImplementar, params, true)
      .then((result) => {
        loading.dismiss();
        this.util.showAlert('Alerta', result['message'])
        this.viewCtrl.dismiss();
      })
      .catch((error) => {
        loading.dismiss();
        this.util.showAlert('Alerta', error.message);
      });
  }

}
