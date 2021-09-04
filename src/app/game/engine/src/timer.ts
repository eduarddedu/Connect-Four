export class Timer {
    static execute(f: Function, thisArg: any, args: any[]) {
        const start = new Date();
        f.apply(thisArg, args);
        const end = new Date();
        return end.getTime() - start.getTime();
    }
}
