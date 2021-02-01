export const global: any = {

    isMap: true,
    isString: false,

    title: "Mi Olímpica",

    API_NEW: 'http://dev.olimpica.gcapp.cl/front/api',
    API_OLD: 'http://dev.olimpica.gcapp.cl/api',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '5433d79a-0135-498c-9202-bc81025d29c3' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '622d6c2e',
        channel: 'Development'
    },
    client_colors: {
        primary: '#cc0033',
        secondary: '#c4c1bf'
    },
    regexp: {
        rut: null
    },
    bundle_id: 'cl.olimpica.gcapp',
    checkUpdate: false,
	show_ranking: true,
    sentry: {
        dsn: 'https://ba495c4651a649eeb397a44c74a271d3@sentry.io/1411346'
    },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    }
};