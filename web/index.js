var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
define("huffman", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    function debug(str) {
        // console.info(str);
    }
    function huffmanEncode(input) {
        var e_1, _a, e_2, _b, e_3, _c;
        debug("Calculating bytes frequency");
        var counts = new Array(256).fill(0);
        try {
            for (var input_1 = __values(input), input_1_1 = input_1.next(); !input_1_1.done; input_1_1 = input_1.next()) {
                var byte = input_1_1.value;
                counts[byte]++;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (input_1_1 && !input_1_1.done && (_a = input_1["return"])) _a.call(input_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        debug("Building initial list");
        // This is not the most efficient way
        //  We know what each Huffman tree will hold 511 nodes,
        //  so we can initiate an array with 511 items and use
        //  array indexes instead of pointers
        var tree = undefined;
        var last = undefined;
        for (var i = 0; i < 256; i++) {
            var byte = i;
            var count = counts[i];
            var item = {
                byte: byte,
                count: count
            };
            if (!last) {
                tree = item;
                last = item;
            }
            else {
                last.next = item;
            }
            last = item;
        }
        if (!tree) {
            throw new Error("Internal error");
        }
        var lastInternalNodeIdx = 0;
        while (true) {
            if (!tree.next) {
                throw new Error("Internal error");
            }
            var current = tree;
            var min1 = undefined;
            var min2 = undefined;
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
            var node = {
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
                    }
                    else {
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
                    }
                    else {
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
            }
            else {
                current = tree;
                while (current) {
                    if (!current.next) {
                        current.next = node;
                        break;
                    }
                    else {
                        current = current.next;
                    }
                }
            }
        }
        debug("Tree created");
        debug("Creating byte helper");
        var helpers = [];
        function goTree(node, path) {
            if (node.left && node.right) {
                var left = path.slice();
                var right = path.slice();
                left.push(0);
                right.push(1);
                goTree(node.left, left);
                goTree(node.right, right);
            }
            else {
                helpers[node.byte] = path;
            }
        }
        goTree(tree, []);
        var totalStreamBitLength = 0;
        for (var i = 0; i < 256; i++) {
            totalStreamBitLength += helpers[i].length * counts[i];
        }
        var totalStreamByteLength = (totalStreamBitLength >> 3) +
            ((totalStreamBitLength & 7) === 0 ? 0 : 1);
        var totalLength = 328 + totalStreamByteLength;
        var output = new Uint8Array(totalLength);
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
        var currentByte = 8;
        var currentBit = 0;
        function writeBit(bit) {
            if (bit === 1) {
                var targetMask = 1 << (7 - currentBit);
                output[currentByte] = output[currentByte] | targetMask;
            }
            else {
                var targetMask = 255 - (1 << (7 - currentBit));
                output[currentByte] = output[currentByte] & targetMask;
            }
            currentBit++;
            if (currentBit >= 8) {
                currentBit = 0;
                currentByte++;
            }
        }
        function writeHeader(current) {
            if (current.left && current.right) {
                // it is a internal node
                debug("Writing internal node idx=" + (current.idx !== undefined ? current.idx + 255 : "err"));
                if (current.idx === undefined) {
                    throw new Error("Internal error");
                }
                writeBit(0);
                writeHeader(current.left);
                writeHeader(current.right);
            }
            else {
                debug("Writing leaf node byte=" + current.byte);
                writeBit(1);
                for (var i = 0; i < 8; i++) {
                    var bit = (current.byte >> (7 - i)) & 1;
                    writeBit(bit ? 1 : 0);
                }
            }
        }
        writeHeader(tree);
        debug("Header is written, byte=" + currentByte + " bit=" + currentBit);
        if (currentByte !== 327 || currentBit !== 7) {
            throw new Error("Internal error: " + currentByte + " " + currentBit);
        }
        writeBit(0);
        debug("Writing data");
        try {
            //debug(`currentbyte=${currentByte} currentBit=${currentBit}`);
            for (var input_2 = __values(input), input_2_1 = input_2.next(); !input_2_1.done; input_2_1 = input_2.next()) {
                var byte = input_2_1.value;
                var bits = helpers[byte];
                //debug(byte, bits, bits.length);
                //process.exit(0);
                if (!bits) {
                    throw new Error("Internal error");
                }
                try {
                    for (var bits_1 = __values(bits), bits_1_1 = bits_1.next(); !bits_1_1.done; bits_1_1 = bits_1.next()) {
                        var bit = bits_1_1.value;
                        writeBit(bit ? 1 : 0);
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (bits_1_1 && !bits_1_1.done && (_c = bits_1["return"])) _c.call(bits_1);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (input_2_1 && !input_2_1.done && (_b = input_2["return"])) _b.call(input_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        while (currentBit > 0) {
            writeBit(0);
        }
        if (currentByte !== totalLength) {
            throw new Error("Internal error " + currentByte + " " + totalLength);
        }
        return output;
        //debug(`Header bit size = ${bitPos}`);
    }
    exports.huffmanEncode = huffmanEncode;
    function huffmanDecode(input) {
        if (input[0] !== 85 ||
            input[1] !== 92 ||
            input[2] !== 110 ||
            input[3] !== 65) {
            throw new Error("Wrong header");
        }
        var size = input[4] + (input[5] << 8) + (input[6] << 16) + (input[7] << 24);
        debug("Output size = " + size);
        var tree = {};
        var bytePos = 8;
        var bitPos = 0;
        function readBit() {
            var bit = (input[bytePos] >> (7 - bitPos)) & 1;
            bitPos++;
            if (bitPos >= 8) {
                bytePos++;
                bitPos = 0;
            }
            return bit;
        }
        function readTree(node) {
            var type = readBit();
            if (type === 0) {
                debug("Got internal node");
                var left = {};
                var right = {};
                node.left = left;
                node.right = right;
                readTree(left);
                readTree(right);
            }
            else {
                var byte = 0;
                for (var i = 0; i < 8; i++) {
                    var bit = readBit();
                    byte += bit > 0 ? Math.pow(2, (7 - i)) : 0;
                }
                debug("Got leaf node byte=" + byte);
                node.byte = byte;
            }
        }
        readTree(tree);
        debug("Tree read done");
        if (bytePos !== 327 || bitPos !== 7) {
            throw new Error("Internal error");
        }
        var padder = readBit();
        if (padder !== 0) {
            throw new Error("Wrong stream");
        }
        var out = new Uint8Array(size);
        var currentByte = 0;
        while (currentByte < size) {
            var node = tree;
            while (node.byte === undefined) {
                var route = readBit();
                if (route === 0) {
                    if (node.left === undefined) {
                        throw new Error("Internal error");
                    }
                    node = node.left;
                }
                else {
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
    exports.huffmanDecode = huffmanDecode;
});
/*

ts-node -T huffman.ts

*/
define("index", ["require", "exports", "huffman"], function (require, exports, huffman_1) {
    "use strict";
    exports.__esModule = true;
    function byId(id) {
        var e = document.getElementById(id);
        if (!e) {
            throw new Error("Not found!");
        }
        return e;
    }
    var statusDiv = byId("status");
    function status(text) {
        statusDiv.innerText = text;
    }
    var packWaInput = byId("pack-wa-input");
    var unpackTsInput = byId("unpack-ts-input");
    var packTsInput = byId("pack-ts-input");
    console.info("Starting");
    status("Starting");
    function downloadBuffer(name, data) {
        var objectUrl = URL.createObjectURL(new Blob([data.buffer], {
            type: "application/octet-stream"
        }));
        var link = document.createElement("a");
        link.style.display = "none";
        document.body.appendChild(link);
        link.href = objectUrl;
        link.download = name;
        link.click();
        URL.revokeObjectURL(objectUrl);
    }
    function readFile(input, callback) {
        status("Reading file");
        var file = input.files ? input.files[0] : undefined;
        if (!file) {
            status("No file");
            return;
        }
        var reader = new FileReader();
        reader.onloadend = function (ee) {
            try {
                var result = reader.result;
                if (!result) {
                    status("File reader error");
                    return;
                }
                var arrayBuf = result;
                var view = new Uint8Array(arrayBuf);
                callback(view, file.name);
            }
            catch (e) {
                console.warn(e);
                status(e.message || "ERROR");
            }
        };
        reader.onerror = function () { return status("Reader error"); };
        reader.readAsArrayBuffer(file);
    }
    function reportTime(run) {
        var started = new Date();
        var result = run();
        var ended = new Date();
        console.info("Finished at " + ended.toISOString() + ", it took " + (ended.getTime() -
            started.getTime()) /
            1000 + " seconds");
        return result;
    }
    function start() {
        return __awaiter(this, void 0, void 0, function () {
            var TOTAL_MEMORY, memory, heapu8, heap32, DYNAMIC_BASE, DYNAMICTOP_PTR, module, imports, inst, wa;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        TOTAL_MEMORY = 65536 * 1000;
                        console.info("Starting WebAssembly with memory=" + TOTAL_MEMORY);
                        memory = new WebAssembly.Memory({
                            initial: TOTAL_MEMORY / 65536
                        });
                        heapu8 = new Uint8Array(memory.buffer);
                        window.heapu8 = heapu8;
                        heap32 = new Int32Array(memory.buffer);
                        DYNAMIC_BASE = 3824;
                        DYNAMICTOP_PTR = 2560;
                        heap32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
                        status("Fetching and building");
                        return [4 /*yield*/, fetch("huffman.wasm")
                                .then(function (response) { return response.arrayBuffer(); })
                                .then(function (bytes) { return WebAssembly.compile(bytes); })];
                    case 1:
                        module = _a.sent();
                        imports = {
                            env: {
                                ___setErrNo: function (n) { return console.error("Got error " + n); },
                                abortOnCannotGrowMemory: function (size) {
                                    throw new Error("Need " + size + " memory");
                                },
                                _emscripten_resize_heap: function (size) {
                                    console.info("_emscripten_resize_heap is not implemented, want " + size + " memory");
                                    throw new Error("_emscripten_resize_heap is not implemented, want " + size + " memory");
                                },
                                //_emscripten_memcpy_big(dest: any, src: any, num: any) {
                                //    console.info(`Copy memory ${dest} ${src} ${num}`);
                                //    heapu8.set(heapu8.subarray(src, src + num), dest);
                                //},
                                _emscripten_get_heap_size: function () {
                                    console.info("Get total heap size");
                                    return TOTAL_MEMORY;
                                },
                                DYNAMICTOP_PTR: DYNAMICTOP_PTR,
                                //get DYNAMICTOP_PTR() {
                                //    // What's this for?
                                //    console.info("Get DYNAMICTOP_PTR");
                                //    return DYNAMICTOP_PTR;
                                //},
                                memory: memory
                            }
                        };
                        return [4 /*yield*/, WebAssembly.instantiate(module, imports)];
                    case 2:
                        inst = _a.sent();
                        wa = inst.exports;
                        window.wa = wa;
                        console.info(inst.exports);
                        status("Ready");
                        console.info("loaded");
                        packWaInput.onchange = function (e) {
                            readFile(packWaInput, function (fileData, fileName) {
                                console.info("Source size = " + fileData.byteLength);
                                status("Allocating");
                                var pointerToSrc = wa._my_malloc(fileData.byteLength);
                                heapu8.set(fileData, pointerToSrc);
                                var pointerToResultSize = wa._my_malloc(4);
                                status("Packing");
                                var pointerToResult = reportTime(function () {
                                    return wa._huffman_encode(pointerToSrc, fileData.byteLength, pointerToResultSize);
                                });
                                wa._my_free(pointerToSrc);
                                status("Packing done");
                                var size = new Uint32Array(heapu8.slice(pointerToResultSize, pointerToResultSize + 4).buffer)[0];
                                console.info("Packed size = " + size);
                                wa._my_free(pointerToResultSize);
                                var packedData = heapu8.slice(pointerToResult, pointerToResult + size);
                                wa._my_free(pointerToResult);
                                window.packedData = packedData;
                                downloadBuffer(fileName + ".huffman", packedData);
                                status("Done");
                            });
                        };
                        unpackTsInput.onchange = function (e) {
                            return readFile(unpackTsInput, function (fileData, fileName) {
                                status("Unpacking");
                                console.info("Packed size = " + fileData.byteLength);
                                var unpacked = reportTime(function () { return huffman_1.huffmanDecode(fileData); });
                                console.info("Unpacked size = " + unpacked.byteLength);
                                status("Unpacked");
                                downloadBuffer(fileName.replace(".huffman", ""), unpacked);
                                status("Done");
                            });
                        };
                        packTsInput.onchange = function (e) {
                            return readFile(packTsInput, function (fileData, fileName) {
                                status("Packing");
                                console.info("Unpacked size = " + fileData.byteLength);
                                var packed = reportTime(function () { return huffman_1.huffmanEncode(fileData); });
                                console.info("Packed size = " + packed.byteLength);
                                status("Packed");
                                downloadBuffer(fileName + ".huffman", packed);
                                status("Done");
                            });
                        };
                        return [2 /*return*/];
                }
            });
        });
    }
    start()["catch"](function (e) {
        console.warn(e);
        status(e.message || "Error");
    });
});
