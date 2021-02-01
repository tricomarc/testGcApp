// Valores estáticos usados por la página add-incident
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: {
				problems: '/basec/problemas/cuentas'
			},
			post: {
				like: '/basec/like'
			}
		},
		oldApi: {
			post: {
				addIncident: '//incidencias'
			},
			get: {
				areas: '/incidencias/areafull'
			},
		}
	},
	extra: {},
	useNewApi: false,
	// Lamentablemente de momento la api sólo responde con 200, por lo que hay que identificar el estado de un request a través de sus mensajes
	api_messages: {
		addIncident: 'Se agregó la incidencia con éxito'
	}
};