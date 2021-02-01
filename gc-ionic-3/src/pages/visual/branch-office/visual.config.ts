// Valores estáticos usados por la página visual
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: { 
				statuses: '/visuales/estados',
				revision: '/visuales/revision',
				info: '/visuales/info',
			},
			post: {
				visuals: '/visuales/reportes',
				implement: '/visuales/implementar_reporte'
			}
		},
		oldApi: {
			get: {
				statuses: '/estados/',
				revision: '/visuales/revision'
			},
			post: {
				visuals: '/visuales/get/'
			}
		}
	},
	extra: {},
	useNewApi: false
};