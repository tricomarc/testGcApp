// Valores estáticos usados por la página visual-zonal
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: {
				revision: '/visuales/revision'
			},
			post: {
				list: '/visuales/listar'
			}
		},
		oldApi: {
			get: {
				revision: '/visuales/revision'
			},
			post: {
				list: '/visuales/listar'
			}
		}
	},
	extra: {},
	useNewApi: false
};