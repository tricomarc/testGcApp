export const checklistConfig = {
	translations: {},
	endpoints: {
		newApi: {
			get: {
				checklists: '/checklist',
				occasionals: '/checklist/getocasional',
				assignment: '/checklist/asignacion',
				questions: '/checklist/preguntas',
				commentary: '/visitas/comentarios/',
				historical: '/checklist'
			},
			post: {
				assignChecklist: '/checklist/setocasional',
				sendAnswers: '/checklist/respuestas',
				finish: '/checklist/finalizar',
				branchOfficeChecklists: '/checklist/visitas',
				branchOfficeOccasionalsChecklists: '/checklist/ocasionales',
				allChecklists: '/checklist/listar',
			}
		}
	},
	extra: {},
	useNewApi: false
};