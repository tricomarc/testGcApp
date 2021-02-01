import { Observable } from "rxjs";

export interface ISchedule {
    isModuleActive: boolean;
    failedRequest: boolean;
    secondsLeft: number;
}