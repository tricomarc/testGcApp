export const global: any = {

    isMap: true,
    isString: false,

    title: "CheckMiniso",

    API_NEW: 'https://miniso.gcapp.cl/front/api',
    API_OLD: 'https://miniso.gcapp.cl/api-v5',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '32838155-480f-4eeb-bd04-f2184b55f0ea' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: 'c5812c08',
        channel: 'Development'
    },
    client_colors: {
        primary: '#d82530',
        secondary: '#FFFFFF'
    },
    regexp: {
        // rut: /^([0-9][\\w]{5,7})+-[\\dkK]$/
        rut: null
    },
    bundle_id: 'cl.gcmin.gcapp',
    checkUpdate: false,
    show_ranking: true,
    sentry: {
        dsn: 'https://5632aec30d974cd188eca93397ee36bd@sentry.io/1411157'
    },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    },
    googlemaps: {
        android_key: 'AIzaSyAz6_pQ2wDlNJKjXeZjKs_9Grxt3Pcysx8',
        ios_key: 'AIzaSyBoF86MBxXt6fA73DtlZnO0DEXjTnTQk_0'
    }
};