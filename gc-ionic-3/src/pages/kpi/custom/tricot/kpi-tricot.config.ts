// Valores estáticos usados por la página kpi
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: {
				areas: '/kpi/areas',
				fulfillments: '/kpi/cumplimientos',
				zones: '/kpi/zonaskpi',
				current_period: '/kpi/dashboard',
				indicator_departments: '/kpi/getKpiVentas',
                kpi_indicator: '/kpi/getKpiIndicadores',
                indicatorDetail: '/kpi/detalleIndicadoresTricot'
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