// Valores estáticos usados por la página edit material report
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: { 
				errors: '',
				detail: ''
			},
			put: {
				edit: ''
			}
		},
		oldApi: {
			get: {
				errors: '/materiales/errores',
				detail: '/materiales/producto/detalle/'
			},
			put: {
				edit: '/materiales/reportar/detalle'
			}
		}
	},
	extra: {},
	useNewApi: false,
	api_messages: {
		edit: 'El material se reporto con éxito.'
	}
};