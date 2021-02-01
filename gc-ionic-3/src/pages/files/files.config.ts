// Valores estáticos usados por la página files
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: {
				folders: ''
			},
			put: {
			}
		},
		oldApi: {
			get: {
				folders: '/carpetas',
				files: '/carpetas/',
				customFiles: '/archivos/get_gestion'
			},
			put: {
				check_schedule: '/archivos'
			}
		}
	},
	extra: {},
	useNewApi: false,
	file_types: [{
		extension: 'pdf',
		image: 'assets/img/resources/pdf.png'
	}, {
		extension: 'doc',
		image: 'assets/img/resources/word.png'
	}, {
		extension: 'txt',
		image: 'assets/img/resources/txt.png'
	}, {
		extension: 'excel',
		image: 'assets/img/resources/excel.png'
	}, {
		extension: 'ppt',
		image: 'assets/img/resources/ppt.png'
	}]
};