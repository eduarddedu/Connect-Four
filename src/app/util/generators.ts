export function* IntegerSequenceGenerator(startInteger: number, isAscending = true) {
    let counter = startInteger;
    while (true) {
        if (isAscending) {
            yield counter++;
        } else {
            yield counter--;
        }
    }
}

export function* UIDGenerator() {
    while (true) {
        return Math.random().toString(16).substring(2);
    }
}

export function* ArrayLoopGenerator(source: any[]) {
    let counter = 0;
    while (true) {
        yield source[counter++ % source.length];
    }
}



