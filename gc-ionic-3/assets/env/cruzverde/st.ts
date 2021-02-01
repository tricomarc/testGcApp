export const global: any = {

    isMap: false,
    isString: true,

    title: "+FOCO",

    API_NEW: 'http://certificacion.fcv-chile.oneapp.cl/front/api',
    API_OLD: 'http://certificacion.fcv-chile.oneapp.cl/api-v5',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '95a00f5a-9233-4642-904b-3f02f8cd13fa' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '1c469c16',
        channel: 'Development'
    },
    client_colors: {
        primary: '#00a24f',
        secondary: '#32b472'
    },
    regexp: {
        rut: null
    },
    bundle_id: 'cl.foco.gcapp',
    checkUpdate: false,
    show_ranking: false,
    sentry: {
        dsn: 'https://44cbcc7ff1d9475387745208d18031e9@sentry.io/1411317'
    },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};