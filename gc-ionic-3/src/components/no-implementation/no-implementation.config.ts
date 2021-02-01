// Valores estáticos usados por el componente no-implementation
export const config = {
	endpoints: {
		newApi: {
			post: {
				addPhoto: '/visuales/subir_foto'
			}
		}
	},
	useNewApi: true,
	// Lamentablemente de momento la api sólo responde con 200, por lo que hay que identificar el estado de un request a través de sus mensajes
	api_messages: {
		addPhoto: 'La foto se agregó correctamente.'
	}
};