// LISTA DE PATENTES ( con puntos recopilados de postman )
export const trucksPatents: ITruck[] = [ 
    {
        placa: 'JFBZ-52',
        estado: 'Paquete normal',
        lat: -33.333969,
        lng: -70.715875,
        ubicacion: 'ubicacion',
        hora: 'hora',
        velocidad: 'velocidad',
        temperatura:  'temperatura'
    },
    {
        placa: 'KLDV-13',
        estado: 'Apagado de motor',
        lat: -33.347490,
        lng: -70.708701,
        ubicacion: 'ubicacion',
        hora: 'hora',
        velocidad: 'velocidad',
        temperatura:  'temperatura'  
    },
    {
        placa: 'LFSK-36',
        estado: 'Paquete normal',
        lat: -33.364540,
        lng: -70.701040,
        ubicacion: 'ubicacion',
        hora: 'hora',
        velocidad: 'velocidad',
        temperatura:  'temperatura'
    },
    {
        placa: 'JCBZ-51',
        estado: 'Apagado de motor',
        lat: -33.371326,
        lng: -70.697988,
        ubicacion: 'ubicacion',
        hora: 'hora',
        velocidad: 'velocidad',
        temperatura:  'temperatura' 
    },
    {
        placa: 'LFSK-26',
        estado: 'Paquete normal',
        lat: -33.374818,
        lng: -70.696480,
        ubicacion: 'ubicacion',
        hora: 'hora',
        velocidad: 'velocidad',
        temperatura:  'temperatura'
    },
    {
        placa: 'GHCF-50',
        estado: 'Apagado de motor',
        lat: -33.387153,
        lng: -70.698076,
        ubicacion: 'ubicacion',
        hora: 'hora',
        velocidad: 'velocidad',
        temperatura:  'temperatura' 
    },
    {
        placa: 'JCBZ-50',
        estado: 'Paquete normal',
        lat: -33.387153,
        lng: -70.698076,
        ubicacion: 'ubicacion',
        hora: 'hora',
        velocidad: 'velocidad',
        temperatura:  'temperatura' 
    }
]

export const mapStyles = [
    {
        "featureType": "poi",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    }
]

export interface ITruck {
	placa: string;
	estado: string;
	lat: number;
	lng: number;
	ubicacion: string;
	hora: string;
	velocidad: string;
	temperatura: string;
}