// Valores estáticos usados por la página visual-revision-detail
export const config = {
	endpoints: {
		newApi: {
			get: {
				report: '/visuales/reporte?reporte_id=',
				statuses: '/visuales/estados',
				info: '/visuales/info'
			},
			put: {
				read: '/visuales/leer_reporte'
			},
			post: {
				commentary: '/visuales/agregar_comentario',
				downloadFile: '/visuales/descargar_archivo',
				accept: '/visuales/aceptar_revision',
				reject: '/visuales/rechazar_revision'
			}
		},
		oldApi: {
			get: {
				info: '/info',
				statuses: '/estados/'
			},
			put: {
				read: '/reportes/leer'
			},
			post: {
				commentary: '/reportes/comentar',
				downloadFile: '/reportes/descargaInstructivo',
				accept: '/reportes/revision/aceptar',
				reject: '/reportes/revision/rechazar'
			}
		}
	},
	useNewApi: false,
	message_api: {
		accept: 'Revision realizada con exito.',
		reject: 'Revision realizada con exito.'
	}
};