function debug(str: string) {
    // console.info(str);
}
export function huffmanEncode(input: Uint8Array) {
    debug("Calculating bytes frequency");
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
    debug("Building initial list");
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
    debug("Tree created");

    debug(`Creating byte helper`);
    type HelperNode = number[];

    const helpers: HelperNode[] = [];
    function goTree(node: TreeAndList, path: HelperNode) {
        if (node.left && node.right) {
            const left = path.slice();
            const right = path.slice();
            left.push(0);
            right.push(1);
            goTree(node.left, left);
            goTree(node.right, right);
        } else {
            helpers[node.byte] = path;
        }
    }
    goTree(tree, []);

    let totalStreamBitLength = 0;
    for (let i = 0; i < 256; i++) {
        totalStreamBitLength += helpers[i].length * counts[i];
    }
    const totalStreamByteLength =
        (totalStreamBitLength >> 3) +
        ((totalStreamBitLength & 7) === 0 ? 0 : 1);
    const totalLength = 328 + totalStreamByteLength;
    const output = new Uint8Array(totalLength);
    output[0] = 85;
    output[1] = 92;
    output[2] = 110;
    output[3] = 65;
    output[4] = input.byteLength & 255;
    output[5] = (input.byteLength >> 8) & 255;
    output[6] = (input.byteLength >> 16) & 255;
    output[7] = (input.byteLength >> 24) & 255;

    // The tree have 256 leaf nodes and 255 internal nodes
    // Bit: 0 - internal, 1 - leaf
    //  if internal, then two childs go next
    //  if leaf, then byte go next

    let currentByte = 8;
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
            debug(
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
            debug(`Writing leaf node byte=${current.byte}`);
            writeBit(1);
            for (let i = 0; i < 8; i++) {
                const bit = (current.byte >> (7 - i)) & 1;
                writeBit(bit ? 1 : 0);
            }
        }
    }
    writeHeader(tree);
    debug(`Header is written, byte=${currentByte} bit=${currentBit}`);
    if (currentByte !== 327 || currentBit !== 7) {
        throw new Error(`Internal error: ${currentByte} ${currentBit}`);
    }
    writeBit(0);

    debug("Writing data");

    //debug(`currentbyte=${currentByte} currentBit=${currentBit}`);

    for (const byte of input) {
        const bits = helpers[byte];
        //debug(byte, bits, bits.length);
        //process.exit(0);
        if (!bits) {
            throw new Error("Internal error");
        }
        for (const bit of bits) {
            writeBit(bit ? 1 : 0);
        }
    }

    while (currentBit > 0) {
        writeBit(0);
    }
    if (currentByte !== totalLength) {
        throw new Error(`Internal error ${currentByte} ${totalLength}`);
    }
    return output;
    //debug(`Header bit size = ${bitPos}`);
}

export function huffmanDecode(input: Uint8Array) {
    if (
        input[0] !== 85 ||
        input[1] !== 92 ||
        input[2] !== 110 ||
        input[3] !== 65
    ) {
        throw new Error("Wrong header");
    }
    const size =
        input[4] + (input[5] << 8) + (input[6] << 16) + (input[7] << 24);
    debug(`Output size = ${size}`);
    interface HuffmanNode {
        left?: HuffmanNode;
        right?: HuffmanNode;
        byte?: number;
    }
    const tree: HuffmanNode = {};
    let bytePos = 8;
    let bitPos = 0;
    function readBit() {
        const bit = (input[bytePos] >> (7 - bitPos)) & 1;
        bitPos++;
        if (bitPos >= 8) {
            bytePos++;
            bitPos = 0;
        }
        return bit;
    }
    function readTree(node: HuffmanNode) {
        const type = readBit();
        if (type === 0) {
            debug("Got internal node");
            const left: HuffmanNode = {};
            const right: HuffmanNode = {};
            node.left = left;
            node.right = right;
            readTree(left);
            readTree(right);
        } else {
            let byte = 0;
            for (let i = 0; i < 8; i++) {
                const bit = readBit();
                byte += bit > 0 ? 2 ** (7 - i) : 0;
            }
            debug(`Got leaf node byte=${byte}`);
            node.byte = byte;
        }
    }
    readTree(tree);
    debug(`Tree read done`);
    if (bytePos !== 327 || bitPos !== 7) {
        throw new Error("Internal error");
    }
    const padder = readBit();
    if (padder !== 0) {
        throw new Error("Wrong stream");
    }
    const out = new Uint8Array(size);
    let currentByte = 0;
    while (currentByte < size) {
        let node: HuffmanNode = tree;
        while (node.byte === undefined) {
            const route = readBit();
            if (route === 0) {
                if (node.left === undefined) {
                    throw new Error("Internal error");
                }
                node = node.left;
            } else {
                if (node.right === undefined) {
                    throw new Error("Internal error");
                }
                node = node.right;
            }
        }
        out[currentByte] = node.byte;
        currentByte++;
    }
    debug("Written");
    return out;
}

/*

ts-node -T huffman.ts

*/
