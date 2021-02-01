// Valores estáticos usados por la página visual
export const config = {
	translations: {},
	endpoints: {
		get: {
			checklists: '/checklist',
			preguntas: '/checklist/preguntas',
            comparador: '/checklist/promedios/ambitos',
		},
        post: {
            respuestas: '/checklist/respuestas'
        }
	},
	extra: {}
};