import { User } from './user';

export class Activity {
    id: number;
    groupId: number;
    time: number;
    value: number;
    peer: string;
    profile?: any;

    public static responseToObject(response: any): Activity {
        const activity = new Activity();
        activity.id = response.id;
        activity.groupId = response.groupId;
        activity.time = response.time;
        activity.peer = response.peer;
        activity.value = response.activity;
        activity.profile = response.profile;
        return activity;
    }
}