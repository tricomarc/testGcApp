import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
  name: 'orderChecklist',
  pure: true
})
export class OrderChecklistPipe implements PipeTransform {
  
  transform( checklist: string, args) {
    // podriamos ordenar por el estado_id pero lo ordenamos asi para incluir el fuera de horario con un estado propio
    _.forEach( checklist, ( check: any ) => {
      if( check.estado_id == 1 && check.activo === true ) check.orden_status = 1;
      else if( check.estado_id== 1 && check.activo == false) check.orden_status = 5;
      
      if( check.estado_id == 2 ) check.orden_status = 2;

      if( check.estado_id == 3 ) check.orden_status = 3;

      if( check.estado_id == 4 ) check.orden_status = 4;
    } );
    
		return _.orderBy( checklist, ( check: any ) => {
			if( check && check.orden_status )return check.orden_status;

			if ( check && check.checklist_id ) return check.checklist_id;
		}, 'asc');
  }
}
