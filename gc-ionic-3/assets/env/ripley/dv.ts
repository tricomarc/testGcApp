export const global: any = {

    isMap: true,
    isString: false,

    title: "ELIGE Chile",

    API_NEW: 'http://dev.ripley.gcapp.cl/front/api',
    API_OLD: 'http://dev.ripley.gcapp.cl/api',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '5dbfea9c-df37-4bca-a3ca-481de166a3bb' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '6c09173e',
        channel: 'Development'
    },
    client_colors: {
        primary: '#1d1d1b',
        secondary: '#424242'
    },
    regexp: {
        rut: null
    },
    bundle_id: 'cl.ripley.gcapp',
    checkUpdate: false,
show_ranking: true,
    sentry: { dsn: 'https://8f0518f64dc240c8b395edc14d24a124@sentry.io/1411344' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};