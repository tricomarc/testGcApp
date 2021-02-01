// Valores estáticos usados por el componente login
export const config = {

	translations: {
		form: {
			ci: 'usuario',
			password: 'clave'
		}
	},
	endpoints: {
		post: {
			login: '/usuarios/login'
		}
	},

	// Para probar en lab de ionic (WEB)
    deviceData: {
        appVersion: "TEST",
        payload: {
            available: true,
            cordova: "TEST",
            isVirtual: true,
            manufacturer: "TEST",
            model: "TEST",
            platform: "TEST",
            serial: "TEST",
            uuid: "TEST",
            version: "TEST"
        }
    }

	/*deviceData: {
		appVersion: null,
			payload: {
				available: true,
				cordova: null,
				isVirtual: true,
				manufacturer: null,
				model: null,
				platform: null,
				serial: null,
				uuid: null,
				version: null
			}
	}*/
};