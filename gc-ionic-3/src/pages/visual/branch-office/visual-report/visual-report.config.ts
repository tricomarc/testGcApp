// Valores estáticos usados por la página visual-report
export const config = {
	endpoints: {
		newApi: {
			get: {
				report: '/visuales/reporte?reporte_id=',
				info: '/visuales/info',
				statuses: '/visuales/estados'
			},
			put: {
				read: '/visuales/leer_reporte'
			},
			post: {
				receivedMaterial: '/visuales/llego_material',
				addCommentary: '/visuales/agregar_comentario',
				downloadFile: '/visuales/descargar_archivo',
				implement: '/visuales/implementar_reporte',
				read: '/visuales/leer_reporte'
			}
		},
		oldApi: {
			get: {
				info: '/info'
			},
			put: {
				read: '/reportes/leer'
			},
			post: {
				receivedMaterial: '/reportes/llegomaterial',
				addCommentary: '/reportes/comentar',
				downloadFile: '/reportes/descargaInstructivo',
				implement: '/reportes/implementar'
			}
		}
	},
	api_messages: {
		report_material: 'Se ha registrado la recepción de material correctamente.',
		implement: 'Registro guardado correctamente.'
	},
	useNewApi: false
};