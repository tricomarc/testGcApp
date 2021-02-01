// Valores estáticos usados por la página ranking
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: {
				categories: '/kpi/menuRanking',
				ranking: '/kpi/ranking'
			}
		},
		oldApi: {
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