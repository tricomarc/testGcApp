export const global: any = {

    isMap: true,
    isString: false,

    title: "FPark",

    API_NEW: 'http://certificacion.fashionspark.gcapp.cl/front/api',
    API_OLD: 'http://certificacion.fashionspark.gcapp.cl/api',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: {id: '6fb6edc0-d452-47f2-a12c-e47e8046bfff'},

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '8d409ada',
        channel: 'Development'
    },
    client_colors: {
        primary: '#AB0133',
        secondary: '#bb335b'
    },
    regexp: {
        rut: null
    },
    bundle_id: 'cl.fashiopark.gcapp',
    checkUpdate: false,
    show_ranking: true,
    sentry: {dsn: 'https://2245f80137524abaa123b5031ba08dc1@sentry.io/1411333'},
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};