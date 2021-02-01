// Valores estáticos usados por la página status-incident
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: {},
			post: {
				accept: '/incidencias/admin/aceptar',
				reject: '/incidencias/admin/rechazar',
				cancellation: '/incidencias/admin/anular',
				change_status_finished: '/incidencias/admin/rechazarFinalizar',
				adm_close: '/incidencias/admin/cierreAdministrativo'
			}
		},
		oldApi: {
			get: {},
			post: {}
		}
	},
	extra: {},
	useNewApi: false,
	api_messages: {
		addPhoto: 'La foto se agrego con éxito.',
		commentary: 'success'
	}
};
