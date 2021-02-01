export const global: any = {

    isMap: false,
    isString: false,

    title: "InformaT",

    API_NEW: 'http://dev.tricot.gcapp.cl/front/api',
    API_OLD: 'http://dev.tricot.gcapp.cl/api',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: 'ec5594c5-a86f-41a7-a4bf-6b98d7e302c3' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: 'c75e07c8',
        channel: 'Development'
    },
    client_colors: {
        primary: '#f80611',
        secondary: '#c4c1bf'
    },
    regexp: {
        // rut: /^([0-9][\\w]{5,7})+-[\\dkK]$/
        rut: null
    },
    bundle_id: 'cl.informatv3.gcapp',
    checkUpdate: false,
show_ranking: true,
    sentry: { dsn: 'https://a419dd762b23425c8eaaf19ce9ad2af7@sentry.io/1411336' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};