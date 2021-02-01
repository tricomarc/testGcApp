// Valores estáticos usados por la página visita
export const config = {
    translations: {},
    endpoints: {
        get: {
            refreshOfflineGet: '/visita/actualizar3',
            getCheck: '/relojcontrol/getcheck',
            getBranchs: '/relojcontrol/sucursales'
        },
        post: {
            refresh: '/visita/actualizar3',
            refreshOfflinePost: '/visita/actualizar3',
            checkIn: '/relojcontrol/checkin',
            checkOut: '/relojcontrol/checkout',
            setChecks: '/relojcontrol/setchecks',
            getChecks: '/relojcontrol/getcheck'
        }
    }
};