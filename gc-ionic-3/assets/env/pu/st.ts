export const global: any = {

    isMap: true,
    isString: false,

    title: "PU",

    API_NEW: 'http://certificacion.pu.gcapp.cl/front/api',
    API_OLD: 'http://certificacion.pu.gcapp.cl/api',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '236cd142-d397-4f6c-b023-8b39fe4d1b04' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: 'f82d8a47',
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
    bundle_id: 'cl.pu.gcapp',
    checkUpdate: false,
show_ranking: true,
    sentry: { dsn: 'https://bf2a5cea15cc4cefbcaae8102a2011c5@sentry.io/1411342' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};