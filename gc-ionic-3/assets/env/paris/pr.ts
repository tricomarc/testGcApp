export const global: any = {

    isMap: true,
    isString: false,

    title: "VM Paris",

    API_NEW: 'https://paris.gcapp.cl/front/api',
    API_OLD: 'https://paris.gcapp.cl/api-v5',
    API_AWS: 'https://api.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '8a485d64-9a58-4bb9-94db-78eb36a57b62' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '18946baf',
        channel: 'Production'
    },
    client_colors: {
        primary: '#1E9CD7',
        secondary: '#4aafdf'
    },
    regexp: {
        // rut: /^([0-9][\\w]{5,7})+-[\\dkK]$/
        rut: null
    },
    bundle_id: 'cl.paris.gcapp',
    checkUpdate: false,
    show_ranking: true,
    sentry: { dsn: 'https://5927a70713084950be0b39826ddff38e@sentry.io/1411343' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};