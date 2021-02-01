// Valores estáticos usados por la página visual
export const config = {
	translations: {},
	endpoints: {
		get: {
			checklists: '/checklist',
            asignacion: '/checklist/asignacion/',
			preguntas: '/checklist/preguntas',
            comparador: '/checklist/promedios/ambitos',
            taskDetail: '/tarea/',
            changeStatus: '/checklist/leido/',
            commentary: '/visitas/comentarios/',
            refreshOfflineGet: '/visita/actualizar3',
            occasionalChecklists: '/checklist/getocasional'
		},
        post: {
            respuestas: '/checklist/respuestas',
            rejectTask: '/tarea/rechazar',
            approveTask: '/tarea',
            finalizar: "/checklist/finalizar",
            refresh: '/visita/actualizar3',
            assignChecklist: '/checklist/setocasional'
        }
	}
};