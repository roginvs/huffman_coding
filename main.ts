import * as fs from "fs";
import { huffmanEncode, huffmanDecode } from "./huffman";

const [actionType, inName, outName] = process.argv.slice(2);
if (actionType === "encode") {
    const input = fs.readFileSync(inName);
    const output = huffmanEncode(input);
    fs.writeFileSync(outName, output);
} else if (actionType === "decode") {
    const input = fs.readFileSync(inName);
    const output = huffmanDecode(input);
    fs.writeFileSync(outName, output);
} else {
    console.info(
        `Usage: ${process.argv[1]} <encode|decode> <in file> <out file>`
    );
    process.exit(1);
}
