export const config = {
    endpoints: {
        get: {
            notificaciones: '/notificaciones/getNotification',
            cambiarEstado: '/notificaciones/setLeida'
            
        },
        post: {
            cambiarEstado: '/notificaciones/setLeida'
        }
    }
}