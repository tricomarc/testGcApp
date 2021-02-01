export interface IPoint {
    latitude: number;
    longitude: number;
    type: string;
    branchOffice: string;
    date: string;
    lastUbication: boolean;
    icon: {
        url: string;
        size: {
            width: number,
            height: number
        }
    }
}