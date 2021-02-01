// Valores estáticos usados por la página kpi-area-detail
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: {
				areas: '/kpi/areas',
				fulfillments: '/kpi/cumplimientos',
				area_detail: '/kpi/detalleareas',
				historical: '/kpi/historicoareas'
			}
		},
		oldApi: {
			get: {
				statistics: '/api/visuales/estadisticas/',
				statuses: '/api/estados/'
			},
			post: {
				visuals: '/api/visuales/get/'
			}
		}
	},
	extra: {},
	useNewApi: false
};