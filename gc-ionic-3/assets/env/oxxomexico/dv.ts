export const global: any = {

    isMap: true,
    isString: false,

    title: "MAD",

    API_NEW: 'https://mad.oneapp.cl/front/api',
    API_OLD: 'https://mad.oneapp.cl/api-v5',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '3c7a66d7-0586-4d1d-85be-1587880b9399' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '4c601133',
        channel: 'Development'
    },
    client_colors: {
        primary: '#8d0f0f',
        secondary: '#c4c1bf'
    },
    regexp: {
        // rut: /^([0-9][\\w]{5,7})+-[\\dkK]$/
        rut: null
    },
    bundle_id: 'cl.oxmex.gcapp',
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