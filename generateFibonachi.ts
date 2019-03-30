function fibonachi(n: number): number {
    if (n === 0 || n === 1) {
        return 1;
    } else {
        return fibonachi(n - 1) + fibonachi(n - 2);
    }
}

const steps = 10;
console.info(`Started with possible bytes = ${steps}`);
let totalBytes = 0;
for (let i = 0; i < steps; i++) {
    totalBytes += fibonachi(i);
}

console.info(`Total bytes = ${totalBytes}`);
const buf = Buffer.alloc(totalBytes);
let pos = 0;
for (let i = 0; i < steps; i++) {
    const byte = (i + 60) % 256;
    const count = fibonachi(i);
    for (let ii = 0; ii < count; ii++) {
        buf[pos] = byte;
        pos++;
    }
}
console.info("Shuffling");
buf.sort((a, b) => (Math.random() > 0.5 ? 1 : -1));
console.info("Writing file");
import * as fs from "fs";

fs.writeFileSync(`test/fibonachi${steps}`, buf);
