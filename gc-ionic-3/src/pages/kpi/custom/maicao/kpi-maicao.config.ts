// Valores estáticos usados por la página kpi
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: {
                fulfillments: '/kpi/cumplimientoIndicadoresPonderadoMaicao',
				details: '/kpi/detallesIndicadoresMaicao',
				menuRanking: '/kpi/menuRanking', 
				rankingZonaIndicadores: '/kpi/rankingZonasIndicadoresMaicao',
				rankingSucursalIndicadores: '/kpi/rankingIndicadoresMaicao',
				historicalChart: '/kpi/cumplimientosHistoricoIndicadoresMaicao'
			}
		}
		/* oldApi: {
			get: {
				statistics: '/api/visuales/estadisticas/',
				statuses: '/api/estados/'
			},
			post: {
				visuals: '/api/visuales/get/'
			}
		} */
	},
	/* extra: {},
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
	] */
};