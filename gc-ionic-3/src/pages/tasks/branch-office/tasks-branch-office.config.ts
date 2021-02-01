// Valores estáticos usados por la página tasks-branch-office
export const config = {
	translations: {},
	endpoints: {
		newApi: {
			get: {
                tasks: '/tareas/listar',
				filters: '/tareas/listado_usuarios_sucursales',
				question_types: '/tareas/tipos_preguntas'
			},
			post: {
				create: '/tareas/create'
			}
		},
		oldApi: {
			get: {
				tasks: '/tarea'
			},
			post: {
			}
		}
	},
	extra: {},
	useNewApi: false
};