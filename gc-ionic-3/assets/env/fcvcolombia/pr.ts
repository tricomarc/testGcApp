export const global: any = {

    isMap: true,
    isString: false,

    title: "+FOCO Colombia",

    API_NEW: 'https://fcvcolombia.gcapp.cl/front/api',
    API_OLD: 'https://fcvcolombia.gcapp.cl/api-v5',
    API_AWS: 'https://api.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: 'abe531a6-1887-4bcc-a62f-7e1450945e82' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: 'c4a8dea2',
        channel: 'Production'
    },
    client_colors: {
        primary: '#00a24f',
        secondary: '#32b472'
    },
    regexp: {
        rut: null
    },
    bundle_id: 'cl.fcvcolombia.gcapp',    
    show_ranking: false,
    sentry: {
        dsn: 'https://8c8babdf471649a3ba7d47ba7ecca3f2@sentry.io/1411312'
    },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};