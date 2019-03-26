function huffmanEncode(input: Buffer, output: Buffer) {
    const counts = new Array(256).fill(0);
    for (const byte of input) {
        counts[byte]++;
    }
    const tree: {
        byte: number;
        nextIdx: number;
        leftIdx: number;
        rightIdx: number;
        count: number;
    }[] = [];
    counts.forEach((byte, count) => {
        tree[byte];
    });
    console.info(counts);
}

import * as fs from "fs";
const input = fs.readFileSync("hpmor_ru.html");
const output = Buffer.alloc(input.byteLength + 0);
const outputSize = huffmanEncode(input, output);
