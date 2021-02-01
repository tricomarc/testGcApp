export const global: any = {

    isMap: true,
    isString: false,

    title: "DINAMO",

    API_NEW: 'http://dev.familyshop.gcapp.cl/front/api',
    API_OLD: 'http://dev.familyshop.gcapp.cl/api',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: 'a646fa41-56ae-45c0-aaed-5a3ce8cfd582' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: 'a61a06cc',
        channel: 'Development'
    },
    client_colors: {
        primary: '#ec6e26',
        secondary: '#c4c1bf'
    },
    regexp: {
        rut: null
    },
    bundle_id: 'cl.dinamo.gcapp',
    checkUpdate: false,
show_ranking: true,
    sentry: {
        dsn: 'https://88a2681823a9413289a0c75a49245b2f@sentry.io/1411330'
    },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};