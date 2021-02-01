// Valores estáticos usados por el componente login

export const config = {

    translations: {},
	endpoints: {
		post: {
            // comunicados: '/comunicados',
            comunicados: '/comunicados/comunicados',
			// details: '/comunicados/detalle'
			details: '/comunicados/comunicado'
		},
        put: {
            comunicados: '/comunicados/update',
        }
	},

    dateFilter: {
        fecha_inicio: "",
        fecha_fin: "",
        usuario_id: "",
        session_id: "",
        uuid: "",
        tipo_id: []
    },

    detailsFilter: {
        comunicado_id: "",
        session_id: "",
        usuario_id: "",
        uuid: ""
    },

    updateState: {
        leido: false,
        comunicado_id: "",
        session_id: "",
        usuario_id: ""
    }
};