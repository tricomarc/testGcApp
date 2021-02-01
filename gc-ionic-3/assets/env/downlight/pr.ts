export const global: any = {

    isMap: true,
    isString: false,

    title: "Ruta Downlight",

    API_NEW: 'https://downlight.gcapp.cl/front/api',
    API_OLD: 'http://downlight.gcapp.cl/api-v5',
    API_AWS: 'https://api.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '5238385a-a8a8-4b6b-b6d2-ecfa291dcd8d' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '104b3914',
        channel: 'Production'
    },
    client_colors: {
        primary: '#255AB0',
        secondary: '#507abf'
    },
    regexp: {
        rut: null
    },
    bundle_id: 'cl.rutadownlight.gcapp',
    checkUpdate: false,
show_ranking: true,
    sentry: { dsn: 'https://0a33b2cd4fe344859ae368174990b5bc@sentry.io/1411322' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    },
    googlemaps: {
        android_key: 'AIzaSyBV05ubk2WPsTOEWgVehlaMK38iFXxjxao',
        ios_key: 'AIzaSyDQwuL769ZtDtw9HHVN0K8scIc5LHo2cjQ'
    }
};