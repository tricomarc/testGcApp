export const global: any = {

    isMap: true,
    isString: false,

    title: "360M",

    // API_NEW: 'https://modelogestionfcv.cruzverde.cl/gc-api-cake-dev-maicao/api',
    // API_OLD: 'https://modelogestionfcv.cruzverde.cl/gc-api-v5-maicao-dev',

    API_NEW: 'https://maicao.gcapp.cl/front/api',
    API_OLD: 'https://modelogestionfcv.cruzverde.cl/gc-api-v5-maicao-dev',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: {id: '4c62526e-836d-4b6f-bfd2-049a888624e5'},

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '586c28f1',
        channel: 'Development'
    },
    client_colors: {
        primary: '#c40177',
        secondary: '#424242'
    },
    regexp: {
        rut: null
    },
    bundle_id: 'cl.maicao.gcapp',
    checkUpdate: false,
    show_ranking: true,
    sentry: {dsn: 'https://5a72ece4e1424a56b24597d8abc87c9d@sentry.io/1411337'},
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};