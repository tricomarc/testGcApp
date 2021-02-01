import { Room } from "./room";

export interface IChat {
	rooms: Room[];
	incomingMessage: any;
	incomingActivity: any;
	isConnecting: boolean;
	isOnline: boolean;
	isRequesting: boolean;
	connected: boolean;
	accessToken: string;
	os: string;
};