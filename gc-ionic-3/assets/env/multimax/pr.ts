export const global: any = {

    isMap: false,
    isString: false,

    title: "SomosloMax",

    API_NEW: 'https://multimax.gcapp.cl/front/api',
    API_OLD: 'https://multimax.gcapp.cl/api-v5',
    API_AWS: 'https://api.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '737a6110-96ff-46cb-a837-d025b6298616' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '00c594a7',
        channel: 'Production'
    },
    client_colors: {
        primary: '#EB0029',
        secondary: '#0098CE'
    },
    regexp: {
        // rut: /^([0-9][\\w]{5,7})+-[\\dkK]$/
        rut: null
    },
    bundle_id: 'cl.multimax.gcapp',
    checkUpdate: false,
show_ranking: true,
    sentry: { dsn: 'https://b6c806fcf1964248a439385ab6758d44@sentry.io/1416677' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};