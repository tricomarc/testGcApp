// Valores estáticos usados por la página chat
export const chatConfig = {
	translations: {},
	endpoints: {
		newApi: {
			get: {
				rooms: '/usuarios/getChats',
				contacts: '/usuarios/listUsersChat',
				mediaParams: '/usuarios/getChatParams',
				schedule: '/usuarios/getChatSchedule'
			},
			post: {
				createChat: '/usuarios/addChatMesibo',
				invite: '/usuarios/sendInviteChat',
				notification: '/usuarios/sendPushNotification',
				makeUserAdmin: '/usuarios/isAdminMesibo',
				updateAvatarOrName: '/usuarios/updateGroupMesibo',
				mute: '/usuarios/setMutedUserChat'
			}
		}
	},
	errors: {
		setAccessToken: { code: 'CM01' },
		stopMesibo: { code: 'CM02' },
		createGroup: { code: 'CM03' },
		getRooms: { code: 'CM04' },
		createChat: { code: 'CM05' },
		sendMessage: { code: 'CM06' },
		deleteUser: { code: 'CM07' },
		makeAdmin: { code: 'CM08' },
		deleteConversation: { code: 'CM09' },
		updateAvatar: { code: 'CM10' },
		updateAvatarOrName: { code: 'CM11' }
	},
	messageStatuses: [{
		status: 136,
		code: 'BLOCKED',
		label: 'bloqueado',
		icon: '',
		class: ''
	}, {
		status: 22,
		code: 'CALLINCOMING',
		label: 'LLamada entrante',
		icon: '',
		class: ''
	}, {
		status: 21,
		code: 'CALLMISSED',
		label: 'LLamada perdida',
		icon: '',
		class: ''
	}, {
		status: 23,
		code: 'CALLOUTGOING',
		label: 'LLamando',
		icon: '',
		class: ''
	}, {
		status: 32,
		code: 'CUSTOM',
		label: 'Personalizado',
		icon: '',
		class: ''
	}, {
		status: 2,
		code: 'DELIVERED',
		label: 'Entregado',
		icon: 'ios-done-all-outline',
		class: 'msg-delivered'
	}, {
		status: 132,
		code: 'EXPIRED',
		label: 'Expirado',
		icon: 'ios-time-outline',
		class: 'msg-sending'
	}, {
		status: 128,
		code: 'FAIL',
		label: 'Falló',
		icon: '',
		class: 'msg-failed'
	}, {
		status: 130,
		code: 'INBOXFULL',
		label: 'Buzón lleno',
		icon: '',
		class: ''
	}, {
		status: 131,
		code: 'INVALIDDEST',
		label: 'Destino inválido',
		icon: '',
		class: ''
	}, {
		status: 0,
		code: 'OUTBOX',
		label: 'Enviando',
		icon: 'ios-time-outline',
		class: 'msg-sending'
	}, {
		status: 3,
		code: 'READ',
		label: 'Leído',
		icon: 'ios-done-all-outline',
		class: 'msg-read'
	}, {
		status: 18,
		code: 'RECEIVEDNEW',
		label: 'Noticia recibida',
		icon: '',
		class: ''
	}, {
		status: 19,
		code: 'RECEIVEDREAD',
		label: 'Leído',
		icon: 'ios-done-all-outline',
		class: 'msg-read'
	}, {
		status: 1,
		code: 'SENT',
		label: 'Enviado',
		icon: 'ios-checkmark-outline',
		class: 'msg-sent'
	}, {
		status: 129,
		code: 'USEROFFLINE',
		label: 'Usuario desconectado',
		icon: '',
		class: ''
	}],
	extra: {},
	useNewApi: false
};