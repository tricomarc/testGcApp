// Valores estáticos usados por la página visual-zonal-page
export const config = {
	endpoints: {
		newApi: {
			get: {
				detail: '/visuales/visual'
			},
			post: {
				downloadFile: '/visuales/descargar_archivo',
			}
		},
		oldApi: {
			get: {
				detail: ''
			}
		}
	}
};