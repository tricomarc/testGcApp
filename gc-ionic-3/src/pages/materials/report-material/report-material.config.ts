// Valores estáticos usados por la página report-material
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: {
				report: ''
			},
			put: {
				report: ''
			}
		},
		oldApi: {
			get: {
				report: '/materiales/productos/'
			},
			put: {
				report: '/materiales/reportar'
			}
		}
	},
	extra: {},
	useNewApi: false,
	api_messages: {
		report: 'Los materiales se reportaron con éxito.'
	}
};