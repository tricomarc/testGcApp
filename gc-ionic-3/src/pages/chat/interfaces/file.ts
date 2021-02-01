import { includes } from 'lodash';

export class File {
    url: string;
    size: string;
    type: string;
    name: string;
    showAs: string;
    downloading?: boolean;

    public static responseToObject(response: any): File {
        const file = new File();
        file.url = response.url;
        file.size = response.size;
        file.type = response.type;
        file.name = response.name;
        file.showAs = File.getShowAs(file.type);
        file.downloading = false;
        return file;
    }

    public static getShowAs(type: string) {
        if (includes(type, 'image')) {
            return 'image';
        }
        if (includes(type, 'video')) {
            return 'video';
        }
        if (includes(type, 'audio')) {
            return 'audio';
        }
        return null;
    }
};