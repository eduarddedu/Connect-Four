export enum UserStatus { Idle, Invited, Playing }

export interface UserData {
    id: string;
    name: string;
    imgUrl: string;
    status: UserStatus;
    points?: number;
}

export class User {
    public readonly id: string;
    public readonly name: string;
    public readonly imgUrl: string;
    public status: UserStatus;
    public points = 0;
    constructor(data: UserData) {
        Object.assign(this, data);

    }
    get statusStr() {
        return UserStatus[this.status];
    }

}

const botData: UserData = {
    id: '0',
    name: 'Bobiță',
    imgUrl: 'assets/img/robot-dog-head-resize.png',
    status: UserStatus.Idle
};

export const Bot: User = new User(botData);




