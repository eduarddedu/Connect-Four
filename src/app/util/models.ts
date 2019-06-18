export interface User {
    id: string;
    name: string;
    imgUrl: string;
    email: string;
    authProvider: 'Google' | 'Facebook' | null;
    status: 'Online' | 'Busy' | 'In game';
}
export const Bot: User = {
    id: '0',
    name: 'Bobiță',
    imgUrl: 'assets/img/robot-dog-head.png',
    email: null,
    authProvider: null,
    status: 'Online'
};

