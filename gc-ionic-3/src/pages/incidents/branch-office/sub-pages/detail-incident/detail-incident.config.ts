// Valores estáticos usados por la página detail-incident
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: {},
			post: {
				addCommentary: '/incidencias/comentar/'
			}
		},
		oldApi: {
			get: {
				incidentDetail: '/incidencias/',
				downloadPhoto: '//incidencias/descargarfoto'
			},
			post: {
				addPhoto: '//incidencias/cargarfoto'
			}
		}
	},
	extra: {},
	useNewApi: false,
	api_messages: {
		addPhoto: 'La foto se agrego con éxito.',
		commentary: 'success'
	}
};