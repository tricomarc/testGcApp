// Valores estáticos usados por la página visit
export const config = {
	translations: {},
	endpoints: {
		get: {
			branchOffices: '/relojcontrol/sucursales',
			checkIn: '/relojcontrol/getcheck',
			refreshOfflineGet: '/visita/actualizar3'
		},
		post: {
			checkIn: '/relojcontrol/checkin',
			checkOut: '/relojcontrol/checkout',
			sendAnswers: '/visita/actualizar3'
		}
	},
	messages: {
		checkinExists: 'Debe marcar la salida pendiente.',
		checkoutSuccess: 'Se guardo la hora de salida con éxito.',
		checkinSuccess: 'Entrada guardada correctamente.',
		updateSuccess: 'Las respuestas se guardaron con éxito.',
		noCheckin: 'No posee algún checkin abierto.',
		checkoutAlreadyDone: 'La visita ya tiene hora de salida registrada.'
	},
	errors: {
		checkout: { code: 'VT02' },
		checkin: { code: 'VT01' }
	},
	extra: {},
	useNewApi: false,
	map_styles: [
		{
			"featureType": "poi",
			"stylers": [
				{
					"visibility": "off"
				}
			]
		},
		{
			"featureType": "transit",
			"stylers": [
				{
					"visibility": "off"
				}
			]
		}
	]
};