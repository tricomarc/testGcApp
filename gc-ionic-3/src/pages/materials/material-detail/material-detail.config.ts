// Valores estáticos usados por la página materials
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: { 
				material: '',
			}
		},
		oldApi: {
			get: {
				material: '/materiales/'
			},
			post: {
				commentary: '/materiales/comentario'
			}
		}
	},
	extra: {},
	useNewApi: false
};