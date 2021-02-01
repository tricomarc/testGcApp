export const global: any = {

    isMap: false,
    isString: false,

    title: "WeAreLounge",

    API_NEW: 'https://lounge.gcapp.cl/front/api',
    API_OLD: 'https://lounge.gcapp.cl/api-v5',
    API_AWS: 'https://api.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '25110602-32ea-41bf-9803-b4982758caaa' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: 'edb7ca19',
        channel: 'Production'
    },
    client_colors: {
        primary: '#000000',
        secondary: '#e32211'
    },
    regexp: {
        // rut: /^([0-9][\\w]{5,7})+-[\\dkK]$/
        rut: null
    },
    bundle_id: 'cl.lounge.gcapp',
    checkUpdate: false,
show_ranking: true,
    sentry: { dsn: 'https://0e0262d45d9b4976848501c416f3c86e@sentry.io/1411347' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};