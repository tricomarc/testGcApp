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
                kpi_indicator: '/kpi/getKpiIndicadores'
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
	useNewApi: false,
	icons_by_area: [
		{ name: 'RETAIL', icon: 'cube' },
		{ name: 'CLIENTES', icon: 'people' },
		{ name: 'EXTRAGARANTIA', icon: 'ribbon' },
		{ name: 'FINANCIERAS', icon: 'stats' },
		{ name: 'OPERACIONES', icon: 'settings' },
		{ name: 'SAC', icon: 'person' },
		{ name: 'OMNICANAL', icon: 'git-network' },
		{ name: 'RRHH', icon: 'man' }
	]
};