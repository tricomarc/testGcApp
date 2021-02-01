// Valores estáticos usados por la página visual
export const config = {
	translations: {},
	endpoints: {
		get: {
			estadisticas: '/estadisticas',
			notificaciones: '/notificaciones/getNotification',
			cambiarEstado: '/notificaciones/setNotificada',
			obtenerVales: '/vales/dashboard'
		},
		post: {
			estadisticas: '/comunicados/dashboard'
		}
	},
	extra: {}
};