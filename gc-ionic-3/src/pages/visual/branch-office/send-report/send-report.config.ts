// Valores estáticos usados por la página send-report
export const config = {
	endpoints: {
		newApi: {
			get: {
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
				info: '/info'
			},
			post: {
				addCommentary: '/fotos/comentario',
				addPhoto: '/fotos',
				deletePhoto: '/visuales/foto_delete',
				report: '/reportes/reportar'
			}
		}
	},
	useNewApi: false,
	// Lamentablemente de momento la api sólo responde con 200, por lo que hay que identificar el estado de un request a través de sus mensajes
	api_messages: {
		deletePhoto: 'La foto se borro correctamente.',
		addPhoto: 'La foto se agregó correctamente.',
		deletePhotoNewApi: 'La foto ha sido eliminada correctamente.',
		report: 'Registro guardado correctamente.'
	}
};