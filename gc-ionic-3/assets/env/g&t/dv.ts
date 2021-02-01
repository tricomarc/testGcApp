export const global: any = {

    isMap: true,
    isString: false,

    title: "Go&Check",

    API_NEW: 'http://dev.goycheck.gcapp.cl/front/api',
    API_OLD: 'http://dev.goycheck.gcapp.cl/api',
    API_AWS: 'https://dev.tuley.cl',
    colors: ['light', 'stable', 'positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark', 'default', 'primary', 'secondary', 'danger'],
    one_signal: { id: '47e71888-42c8-4b9f-b649-8e0bfe77b182' },

    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    },
    pro: {
        appId: '74a9d07e',
        channel: 'Development'
    },
    client_colors: {
        primary: '#3399ff',
        secondary: '#99ccff'
    },
    regexp: {
        // rut: /^([0-9][\\w]{5,7})+-[\\dkK]$/
        rut: null
    },
    bundle_id: 'cl.goandcheck.gcapp',
    checkUpdate: false,
    show_ranking: true,
    sentry: { dsn: '' },
    dictionary: {
        timeout: 'No hemos podido establecer conexión con el servidor.',
        notFound: 'No hemos encontrado respuesta para su solicitud.',
        default: 'Error de conexión con el servidor',
        contact: "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl"
    },
    savePhotosInAlbum: true,
    sendChecklistAtEnding: true,
    leaveWithIncompleteChecklist: false,
    allowAllCheckinToGeneral: true,
    showQuestionsAsSlides: true
};