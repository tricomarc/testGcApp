export const global: any = {

    isMap: true,
    isString: false,

    title: "WADOS",

    API_NEW: 'https://wados.gcapp.cl/front/api',
    API_OLD: 'https://wados.gcapp.cl/api-v5',
    API_AWS: 'https://api.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '16011b7f-9ab6-4e3e-b1e3-5b56974044f9' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '1a405639',
        channel: 'Production'
    },
    client_colors: {
        primary: '#e97922',
        secondary: '#c4c1bf'
    },
    regexp: {
        // rut: /^([0-9][\\w]{5,7})+-[\\dkK]$/
        rut: null
    },
    bundle_id: 'cl.wados.gcapp',
    checkUpdate: false,
show_ranking: true,
    sentry: { dsn: 'https://1364ec404513476088657eb4f846964a@sentry.io/1411345' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};