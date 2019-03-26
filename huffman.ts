function huffmanEncode(input: Buffer, output: Buffer) {
    console.info("Calculating bytes frequency");
    const counts = new Array(256).fill(0);
    for (const byte of input) {
        counts[byte]++;
    }
    interface TreeAndList {
        byte: number;
        next?: TreeAndList;
        left?: TreeAndList;
        right?: TreeAndList;
        idx?: number; // Index for internal node to pack into header
        count: number;
    }
    console.info("Building initial list");
    // This is not the most efficient way
    //  We know what each Huffman tree will hold 511 nodes,
    //  so we can initiate an array with 511 items and use
    //  array indexes instead of pointers
    let tree: TreeAndList | undefined = undefined;
    let last: TreeAndList | undefined = undefined;
    for (let i = 0; i < 256; i++) {
        const byte = i;
        const count = counts[i];
        const item: TreeAndList = {
            byte,
            count
        };
        if (!last) {
            tree = item;
            last = item;
        } else {
            last.next = item;
        }
        last = item;
    }
    if (!tree) {
        throw new Error("Internal error");
    }
    let lastInternalNodeIdx = 0;
    while (true) {
        if (!tree.next) {
            throw new Error("Internal error");
        }
        let current: TreeAndList | undefined = tree;
        let min1: TreeAndList | undefined = undefined;
        let min2: TreeAndList | undefined = undefined;

        // Find a first minimum in list
        while (current) {
            if (!min1 || current.count < min1.count) {
                min1 = current;
            }
            current = current.next;
        }

        // Find a second minimum in list
        current = tree;
        while (current) {
            if (!min2 || current.count < min2.count) {
                if (current !== min1) {
                    min2 = current;
                }
            }
            current = current.next;
        }
        if (!min1) {
            throw new Error("Internal error: min1 not found");
        }
        if (!min2) {
            throw new Error("Internal error: min2 not found");
        }
        // Create a new iternal node
        lastInternalNodeIdx++;
        const node: TreeAndList = {
            byte: 0,
            count: min1.count + min2.count,
            left: min1,
            right: min2,
            idx: lastInternalNodeIdx,
            next: undefined
        };

        // Remove min1 from list
        current = tree;
        last = undefined;
        while (current) {
            if (current === min1) {
                if (!last) {
                    tree = current.next;
                } else {
                    last.next = current.next;
                }
            }
            last = current;
            current = current.next;
        }

        // Remove min2 from list
        current = tree;
        last = undefined;
        while (current) {
            if (current === min2) {
                if (!last) {
                    tree = current.next;
                } else {
                    last.next = current.next;
                }
            }
            last = current;
            current = current.next;
        }

        // Add a new item into list
        if (!tree) {
            // That was last pair. Tree is new node
            tree = node;
            break;
        } else {
            current = tree;
            while (current) {
                if (!current.next) {
                    current.next = node;
                    break;
                } else {
                    current = current.next;
                }
            }
        }
    }
    console.info("Tree created");
    output.writeInt32LE(input.byteLength, 0);
    // The tree have 256 leaf nodes and 255 internal nodes
    // Bit: 0 - internal, 1 - leaf
    //  if internal, then two childs go next
    //  if leaf, then byte go next

    let currentByte = 4;
    let currentBit = 0;
    function writeBit(bit: 0 | 1) {
        if (bit === 1) {
            const targetMask = 1 << (7 - currentBit);
            output[currentByte] = output[currentByte] | targetMask;
        } else {
            const targetMask = 255 - (1 << (7 - currentBit));
            output[currentByte] = output[currentByte] & targetMask;
        }
        currentBit++;
        if (currentBit >= 8) {
            currentBit = 0;
            currentByte++;
        }
    }

    function writeHeader(current: TreeAndList) {
        if (current.left && current.right) {
            // it is a internal node
            console.info(
                `Writing internal node idx=${
                    current.idx !== undefined ? current.idx + 255 : "err"
                }`
            );
            if (current.idx === undefined) {
                throw new Error("Internal error");
            }
            writeBit(0);
            writeHeader(current.left);
            writeHeader(current.right);
        } else {
            console.info(`Writing leaf node byte=${current.byte}`);
            writeBit(1);
            for (let i = 0; i < 8; i++) {
                const bit = (current.byte >> (7 - i)) & 1;
                writeBit(bit ? 1 : 0);
            }
        }
    }
    writeHeader(tree);
    console.info(`Header is written, byte=${currentByte} bit=${currentBit}`);

    if (currentBit !== 0) {
        currentByte++;
    }
    return currentByte;
    //console.info(`Header bit size = ${bitPos}`);
}

import * as fs from "fs";
const input = fs.readFileSync("hpmor_ru.html");
const output = Buffer.alloc(input.byteLength + 0);
const outputSize = huffmanEncode(input, output);
fs.writeFileSync("hpmor_ru.html.ts.huffman", output.slice(0, outputSize));
