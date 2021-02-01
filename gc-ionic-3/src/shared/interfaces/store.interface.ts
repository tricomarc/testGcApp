export interface IStore {
    id: number;
    lat: number;
    lng: number;
    name: string;
    realName: string;
    zoneId: number;
    zoneType: string;
    checkinStatus?: {
        code: string;
        icon: string;
        name: string;
    };
};