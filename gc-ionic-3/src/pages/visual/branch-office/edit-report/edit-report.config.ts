// Valores estáticos usados por la página edit-report
export const config = {
	endpoints: {
		newApi: {
			get: {
				report: '/visuales/reporte?reporte_id=',
				info: '/visuales/info'
			},
			post: {
				addPhoto: '/visuales/subir_foto',
				addCommentary: '/visuales/foto_comentario',
				deletePhoto: '/visuales/foto_delete',
				addVideo: '/visuales/subir_video',
				report: '/visuales/enviar_reporte'
			}
		},
		oldApi: {
			get: {
				report: '/reportes/get?reporte_id=',
				info: '/info'
			},
			post: {
				addCommentary: '/fotos/comentario',
				addPhoto: '/fotos',
				editReport: '/reportes/edit'
			}
		}
	},
	useNewApi: false,
	extra: {
		statuses: [
			{ key: 1, value: 'No montado' },
			{ key: 2, value: 'Implementada' },
			{ key: 3, value: 'Aceptada' },
			{ key: 10, value: 'Aceptada con observaciones' },
			{ key: 11, value: 'Mal implementada' },
			{ key: 0, value: 'Caducada' }
		]
	},
	// Lamentablemente de momento la api sólo responde con 200, por lo que hay que identificar el estado de un request a través de sus mensajes
	api_messages: {
		deletePhoto: 'La foto se borro correctamente.',
		deletePhotoNewApi: 'La foto ha sido eliminada correctamente.',
		addPhoto: 'La foto se agregó correctamente.',
		editReport: 'Registro guardado correctamente.'
	}
};