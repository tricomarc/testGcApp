export const global: any = {

    isMap: true,
    isString: false,

    title: "Estandariza",

    API_NEW: 'http://certificacion.hites.gcapp.cl/front/api',
    API_OLD: 'http://certificacion.hites.gcapp.cl/api',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '154fd5d5-3188-45a4-863f-a99b588047dc' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '70f6efe3',
        channel: 'Development'
    },
    client_colors: {
        primary: '#0b66ae',
        secondary: '#3b84be'
    },
    regexp: {
        rut: null
    },
    bundle_id: 'cl.estandariza.gcapp',
    checkUpdate: false,
show_ranking: true,
    sentry: { dsn: 'https://63901cdc303d46d7a49d669356a2482a@sentry.io/1411334' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};