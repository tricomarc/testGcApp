// Valores estáticos usados por la página detail-incident
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: {
				filters: '/incidencias/admin/filtros',
				incidents: '/incidencias/admin',
				incidentDetail: '/incidencias/admin/'
			},
			post: {
				addCommentary: '/incidencias/comentar/'
			}
		},
		oldApi: {
			get: {
				detailIncident: '/incidencias/',
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