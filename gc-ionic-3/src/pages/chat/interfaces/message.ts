import { File } from './file';
import { User } from './user';
import { IStatus } from './status.interface';

export class Message {
    id: any;
    groupId: number;
    time: number;
    /*
        Types -> 1 = normal, 2 = file, 3 = location, 4 = sticker, 5 = event_log
    */
    type: number;
    status: IStatus;
    resent: boolean;
    isIncoming: boolean;
    content: string;
    peer: string;
    sender: String;
    owner: User;
    reference: Message;
    file: File;
    isUserBreak?: boolean;
    pending?: boolean;


    public static responseToObject(response: any): Message {
        const message = new Message();
        message.id = response.id;
        message.groupId = response.groupId;
        message.time = response.time;
        message.type = response.type;
        message.status = response.status;
        message.resent = response.resent;
        message.isIncoming = response.isIncoming;
        message.content = response.content;
        message.peer = response.peer;
        message.reference = response.reference;
        message.file = ((message.type === 2 && response.file.url) ? File.responseToObject(response.file) : null);
        message.sender = response.sender;
        message.pending = (response.pending === true ? true : false);
        return message;
    }
}