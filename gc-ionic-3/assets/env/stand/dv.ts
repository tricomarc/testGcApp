export const global: any = {

    isMap: true,
    isString: false,

    title: "VISAPP",

    API_NEW: 'http://dev.stand.gcapp.cl/front/api',
    API_OLD: 'http://dev.stand.gcapp.cl/gc-api',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '63dbe377-4796-4547-b9ce-35b0956693ee' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '148f4952',
        channel: 'Development'
    },
    client_colors: {
        primary: '#1589C9',
        secondary: '#43a0d3'
    },
    regexp: {
        rut: null
    },
    bundle_id: 'cl.stand.gcapp',
    checkUpdate: false,
    show_ranking: true,
    sentry: { dsn: 'https://369d0d94eebb47adb4aa1fb48db6d1d3@sentry.io/1782968' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};