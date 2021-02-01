export const global: any = {

    isMap: true,
    isString: false,

    title: "OPERA APP",

    API_NEW: 'http://dev.corona.gcapp.cl/front/api',
    API_OLD: 'http://dev.corona.gcapp.cl/gc-api',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: {id: '368974af-cbfb-4b25-87e2-c030110e4654'},

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '2ca3b026',
        channel: 'Development'
    },
    client_colors: {
        primary: '#7443b7',
        secondary: '#8f68c5'
    },
    regexp: {
        rut: null
    },
    bundle_id: 'cl.operav3.gcapp',
    checkUpdate: false,
    show_ranking: true,
    sentry: {
        dsn: 'https://5362ec6d08774fe793eb2c223055f744@sentry.io/1411315'
    },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};