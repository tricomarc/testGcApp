export const global: any = {

    isMap: true,
    isString: false,

    title: "CASINOS INTEGRADOS",

    API_NEW: 'http://dev.casinos.gcapp.cl/front/api',
    API_OLD: 'http://dev.casinos.gcapp.cl/api',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '3bc81901-75d7-401d-9168-9f4fb1ab1dee' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '2c7c96d9',
        channel: 'Development'
    },
    client_colors: {
        primary: '#d27e1f',
        secondary: '#e4c19a'
    },
    regexp: {
        // rut: /^([0-9][\\w]{5,7})+-[\\dkK]$/
        rut: null
    },
    bundle_id: 'cl.casinosintegrados.gcapp',
    checkUpdate: false,
    show_ranking: true,
    sentry: { dsn: '' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};