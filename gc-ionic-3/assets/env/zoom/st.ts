export const global: any = {

    isMap: true,
    isString: false,

    title: "ZOOM",

    API_NEW: 'http://certificacion.zoom.gcapp.cl/front/api',
    API_OLD: 'http://certificacion.zoom.gcapp.cl/api',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '684aa42a-a7f8-4225-99dd-2dd3eb673f24' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: 'f3feb645',
        channel: 'Development'
    },
    client_colors: {
        primary: '#000',
        secondary: '#99ccff'
    },
    regexp: {
        // rut: /^([0-9][\\w]{5,7})+-[\\dkK]$/
        rut: null
    },
    bundle_id: 'cl.zoom.gcapp',
    checkUpdate: false,
    show_ranking: true,
    sentry: { dsn: 'https://0e0262d45d9b4976848501c416f3c86e@sentry.io/1411347' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    },
    sendChecklistAtEnding: true
};