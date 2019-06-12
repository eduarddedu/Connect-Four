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



