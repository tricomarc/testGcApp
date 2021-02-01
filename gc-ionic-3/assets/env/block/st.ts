export const global: any = {

    isMap: false,
    isString: false,

    title: "Block",

    API_NEW: 'http://certificacion.block.gcapp.cl/front/api',
    API_OLD: 'http://certificacion.block.gcapp.cl/api',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '712d4db6-54f0-4269-8dc9-0154a5dc15d0' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '58430cb3',
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
    bundle_id: 'cl.block.gcapp',
    checkUpdate: false,
show_ranking: true,
    sentry: {
        dsn: 'https://622fa62adf894a01b429c18ab3057cfc@sentry.io/1411314'
    },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};