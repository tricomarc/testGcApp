export const global: any = {

    isMap: true,
    isString: false,

    title: "MasGestionGPF",

    API_NEW: 'https://fcvecuador.gcapp.cl/front/api',
    API_OLD: 'https://fcvecuador.gcapp.cl/api-v5',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: 'fcfd4145-3f57-461e-8563-bd69042f4ac9' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '7ba63049',
        channel: 'Development'
    },
    bundle_id: 'cl.gcfcve.gcapp',
    client_colors: {
        primary: '#333366',
        secondary: '#696772'
    },
    regexp: {
        // rut: /^([0-9][\\w]{5,7})+-[\\dkK]$/
        rut: null
    },
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