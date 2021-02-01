export const global: any = {

    isMap: false,
    isString: false,

    title: "Modella",

    API_NEW: 'http://certificacion.modella.gcapp.cl/front/api',
    API_OLD: 'http://certificacion.modella.gcapp.cl/api',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '9a4221e9-0d45-47bc-9589-cf33e2826595' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '109ff7cd',
        channel: 'Development'
    },
    client_colors: {
        primary: '#43413D',
        secondary: '#FED843'
    },
    regexp: {
        // rut: /^([0-9][\\w]{5,7})+-[\\dkK]$/
        rut: null
    },
    bundle_id: 'cl.modella.gcapp',
    checkUpdate: false,
show_ranking: true,
    sentry: { dsn: 'https://d1cebb90cb82495f9e2f69dba45186b4@sentry.io/1411339' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};