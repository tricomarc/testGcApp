import { Message } from "./message";

export interface IRoomDate {
    value: number;
    label: string;
    messages: Message[];
    alternativeLabel?: string;
};