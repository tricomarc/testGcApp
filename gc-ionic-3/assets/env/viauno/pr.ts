export const global: any = {

    isMap: true,
    isString: false,

    title: "Mi Via",

    API_NEW: 'https://mivia.oneapp.cl/front/api',
    API_OLD: 'https://mivia.oneapp.cl/api-v5',
    API_AWS: 'https://api.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '417e6537-a332-42d4-b43d-612a68c9f39f' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: 'f7ea4096',
        channel: 'Production'
    },
    client_colors: {
        primary: '#000000',
        secondary: '#ffffff'
    },
    regexp: {
        // rut: /^([0-9][\\w]{5,7})+-[\\dkK]$/
        rut: null
    },
    bundle_id: 'cl.gcvuno.gcapp',
    checkUpdate: false,
show_ranking: true,
    sentry: { dsn: 'https://2ff2a8ef4153448bb3f51394ad13699f@sentry.io/1411341' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};