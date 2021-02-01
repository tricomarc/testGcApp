// Valores estáticos usados por el componente login
export const config = {

	userData: {
		name: "",
		charge: "",
		type: "",
		charge_code: "",
		email: "",
		sucursales: []
	},
    endpoints: {
        post: {
            refresh: '/visita/actualizar3',
            addUserMesibo: '/usuarios/addUserMesibo'
        }
    }
};