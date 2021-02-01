// Valores estáticos usados por la página incidents-branch-office
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: {
				statuses: '/incidencias/estadosIncidencias'
			}
		},
		oldApi: {
			get: {
				incidents: '/incidencias',
				areas: '/incidencias/areafull'
			},
			post: {
				visuals: '/visuales/get/'
			}
		}
	},
	extra: {},
	useNewApi: false,
	filters: {
		statuses: ['Todos', 'Resuelta', 'En Proceso', 'Solicitada', 'Caducada', 'Rechazada', 'Vencida', 'Anulada']
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