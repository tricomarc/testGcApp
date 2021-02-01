export const global: any = {

    isMap: true,
    isString: false,

    title: "Modo R",

    API_NEW: 'http://certificacion.ripleyperu.gcapp.cl/front/api',
    API_OLD: 'http://certificacion.ripleyperu.gcapp.cl/api',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: 'e4e0a870-34d9-4a71-81e1-103c0bfbf106' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '0a857e52',
        channel: 'Development'
    },
    client_colors: {
        primary: '#672666',
        secondary: '#855184'
    },
    regexp: {
        rut: null
    },
    bundle_id: 'cl.ripleyperu.gcapp',
    checkUpdate: false,
    show_ranking: true,
    sentry: { dsn: 'https://a2f636c2292d4af1b74861bc347fe42a@sentry.io/1411324' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};