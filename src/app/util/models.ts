export interface User {
    id: string;
    name: string;
    imgUrl: string;
    email?: string;
    status: 'Online' | 'Invited' | 'In game';
    points?: number;
}
export const Bot: User = {
    id: '0',
    name: 'Bobiță',
    imgUrl: 'assets/img/robot-dog-head-resize.png',
    email: null,
    status: 'Online',
    points: 0
};

