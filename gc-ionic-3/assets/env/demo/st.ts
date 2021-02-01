export const global: any = {

    isMap: true,
    isString: false,

    /*title: "GC APP",*/
    title: "ONEapp",

    API_NEW: 'https://demo.oneapp.cl/front/api',
    API_OLD: 'http://demo.oneapp.cl/api-v5',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '15dbe338-94ea-4b06-8c80-23e31d65d4a8' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '108390ff',
        channel: 'Development'
    },
    /*client_colors: {
        primary: '#0088cc',
        secondary: '#329fd6'
    },*/
    client_colors: {
        primary: '#02355B',
        secondary: '#3F6C8E'
    },
    regexp: {
        rut: null
    },
    bundle_id: 'cl.demo.gcapp',
    checkUpdate: false,
    show_ranking: true,
    sentry: { dsn: 'https://ba495c4651a649eeb397a44c74a271d3@sentry.io/1411346' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};