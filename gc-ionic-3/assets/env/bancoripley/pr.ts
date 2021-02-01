export const global: any = {

    isMap: true,
    isString: false,

    title: "ELIGE BR",

    API_NEW: 'https://bancoripley.gcapp.cl/front/api',
    API_OLD: 'http://bancoripley.gcapp.cl/api-v5',
    API_AWS: 'https://api.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: 'b8f0d8ee-2114-495c-9a8d-c0729dc73a07' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '587db22c',
        channel: 'Production'
    },
    client_colors: {
        primary: '#543379',
        secondary: '#745992'
    },
    regexp: {
        rut: null
    },    
    bundle_id: 'cl.bancoripley.gcapp',
    checkUpdate: false,
    show_ranking: true,
    sentry: {
        dsn: 'https://f05566c0a51c41ea8827f5e609733987@sentry.io/1411321'
    },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};