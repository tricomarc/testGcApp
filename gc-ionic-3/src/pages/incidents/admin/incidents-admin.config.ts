// Valores estáticos usados por la página incidents-admin
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: {
				filters: '/incidencias/admin/filtros',
				incidents: '/incidencias/admin',
				vencidas: '/incidencias/general/vencidas'
			}
		},
		oldApi: {}
	},
	extra: {},
	useNewApi: false,
	filters: {
		statuses: ['Todas', 'Resuelta', 'En Proceso', 'Solicitada', 'Caducada', 'Rechazada', 'Vencida']
	},
	icons_by_status: [
		{ icon: 'icon ion-checkmark balanced', statuses: ['Resuelta'] },
		{ icon: 'icon ion-clock energized', statuses: ['En Proceso'] },
		{ icon: 'icon ion-alert-circled assertive', statuses: ['Solicitada', 'En Espera'] },
		{ icon: 'icon ion-alert-circled dark', statuses: ['Anulada', 'Rechazada', 'Vencida'] },
		{ icon: '', statuses: 'Rechazada' },
		{ icon: '', statuses: 'Vencida' }
	]
};