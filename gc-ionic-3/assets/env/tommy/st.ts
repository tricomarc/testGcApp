export const global: any = {

    isMap: false,
    isString: false,

    title: "TH Chile",

    API_NEW: 'http://certificacion.tommy.gcapp.cl/front/api',
    API_OLD: 'http://certificacion.tommy.gcapp.cl/api',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '50be10fd-a052-4198-ad15-3ce7394b4807' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: 'acb31d16',
        channel: 'Development'
    },
    client_colors: {
        primary: '#011554',
        secondary: '#D71132'
    },
    regexp: {
        // rut: /^([0-9][\\w]{5,7})+-[\\dkK]$/
        rut: null
    },
    bundle_id: 'cl.tommy.gcapp',
    checkUpdate: false,
    show_ranking: true,
    sentry: { dsn: 'https://4c9800d1d49b416e95b8bc7350fca3b1@sentry.io/1421715' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};