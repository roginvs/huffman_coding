/// <reference path="./webassembly.d.ts" />
import { huffmanEncode, huffmanDecode } from "./huffman";

function byId(id: string) {
    const e = document.getElementById(id);
    if (!e) {
        throw new Error("Not found!");
    }
    return e;
}
const statusDiv = byId("status");
function status(text: string) {
    statusDiv.innerText = text;
}

const packWaInput = byId("pack-wa-input") as HTMLInputElement;
const unpackWaInput = byId("unpack-wa-input") as HTMLInputElement;
const packTsInput = byId("pack-ts-input") as HTMLInputElement;
const unpackTsInput = byId("unpack-ts-input") as HTMLInputElement;
console.info("Starting");
status("Starting");

function toggleButtonsDisabled(isDisabled: boolean) {
    // document.querySelectorAll("button").forEach(b => (b.disabled = isDisabled));
    document.querySelectorAll(".container").forEach(elem => {
        if (elem instanceof HTMLElement) {
            elem.style.display = isDisabled ? "none" : "";
        }
    });
}

function downloadBuffer(name: string, data: Uint8Array) {
    const objectUrl = URL.createObjectURL(
        new Blob([data.buffer], {
            type: "application/octet-stream"
        })
    );
    const link = document.createElement("a");
    link.style.display = "none";
    document.body.appendChild(link);
    link.href = objectUrl;
    link.download = name;
    link.click();
    setTimeout(() => {
        // TODO: How to make it proper way?
        // Is it possible to have a callback when link is downloaded?
        URL.revokeObjectURL(objectUrl);
        document.body.removeChild(link);
    }, 60000);
}

function onInputReadFile(
    input: HTMLInputElement,
    callback: (fileData: Uint8Array, fileName: string) => void
) {
    input.onchange = () => {
        toggleButtonsDisabled(true);
        status("Reading file");
        const file = input.files ? input.files[0] : undefined;
        if (!file) {
            status("No file was selected");
            toggleButtonsDisabled(false);
            return;
        }
        const reader = new FileReader();
        reader.onloadend = ee => {
            try {
                const result = reader.result;
                if (!result) {
                    status("File reader error");
                    return;
                }
                const arrayBuf = result as ArrayBuffer;
                const view = new Uint8Array(arrayBuf);
                callback(view, file.name);
            } catch (e) {
                console.warn(e);
                status(e.message || "ERROR");
            }
        };
        reader.onerror = () => status("Reader error");
        reader.readAsArrayBuffer(file);
    };
}
function reportTime<T>(run: () => T) {
    const started = new Date();
    const result = run();
    const ended = new Date();
    console.info(
        `Finished at ${ended.toISOString()}, it took ${(ended.getTime() -
            started.getTime()) /
            1000} seconds`
    );
    return result;
}
async function start() {
    const TOTAL_MEMORY = 65536 * 1000;
    console.info(`Starting WebAssembly with memory=${TOTAL_MEMORY}`);
    const memory = new WebAssembly.Memory({
        initial: TOTAL_MEMORY / 65536
    });
    const heapu8 = new Uint8Array(memory.buffer);
    (window as any).heapu8 = heapu8;
    const heap32 = new Int32Array(memory.buffer);

    // This magic is takes from original emscripten js files
    const DYNAMIC_BASE = 3824;
    const DYNAMICTOP_PTR = 2560;
    heap32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

    status("Fetching and building");
    const wamodule = await fetch("huffman.wasm")
        .then(response => response.arrayBuffer())
        .then(bytes => WebAssembly.compile(bytes));
    const imports = {
        env: {
            ___setErrNo: (n: number) => console.error(`Got error ${n}`),
            abortOnCannotGrowMemory: (size: number) => {
                throw new Error(`Need ${size} memory`);
            },
            _emscripten_resize_heap: (size: number) => {
                console.info(
                    `_emscripten_resize_heap is not implemented, want ${size} memory`
                );
                throw new Error(
                    `_emscripten_resize_heap is not implemented, want ${size} memory`
                );
            },
            //_emscripten_memcpy_big(dest: any, src: any, num: any) {
            //    console.info(`Copy memory ${dest} ${src} ${num}`);
            //    heapu8.set(heapu8.subarray(src, src + num), dest);
            //},
            _emscripten_get_heap_size() {
                console.info(`Get total heap size`);
                return TOTAL_MEMORY;
            },
            DYNAMICTOP_PTR,
            //get DYNAMICTOP_PTR() {
            //    // What's this for?
            //    console.info("Get DYNAMICTOP_PTR");
            //    return DYNAMICTOP_PTR;
            //},
            memory
        }
    };
    const inst = await WebAssembly.instantiate(wamodule, imports);
    const wa = inst.exports as {
        _huffman_encode: (
            pointerToInput: number,
            inputLength: number,
            pointerToResultOutputLength: number
        ) => number;
        _huffman_decode: (
            pointerToInput: number,
            pointerToResultOutputLength: number
        ) => number;
        _my_malloc: (size: number) => number;
        _my_free: (pointerToFree: number) => void;
    };
    (window as any).wa = wa;
    console.info(inst.exports);
    status("Ready");
    console.info("loaded");

    onInputReadFile(packWaInput, (fileData, fileName) => {
        console.info(`Source size = ${fileData.byteLength}`);
        status("Allocating");
        const pointerToSrc = wa._my_malloc(fileData.byteLength);
        heapu8.set(fileData, pointerToSrc);
        const pointerToResultSize = wa._my_malloc(4);
        status("Packing");

        const pointerToResult = reportTime(() =>
            wa._huffman_encode(
                pointerToSrc,
                fileData.byteLength,
                pointerToResultSize
            )
        );

        wa._my_free(pointerToSrc);
        status("Packing done");
        const size = new Uint32Array(
            heapu8.slice(pointerToResultSize, pointerToResultSize + 4).buffer
        )[0];
        console.info(`Packed size = ${size}`);
        wa._my_free(pointerToResultSize);
        const packedData = heapu8.slice(
            pointerToResult,
            pointerToResult + size
        );
        wa._my_free(pointerToResult);
        (window as any).packedData = packedData;
        downloadBuffer(fileName + ".huffman", packedData);
        toggleButtonsDisabled(false);
        status("Done");
    });

    onInputReadFile(unpackWaInput, (fileData, fileName) => {
        console.info(`Source size = ${fileData.byteLength}`);
        status("Allocating");
        const pointerToSrc = wa._my_malloc(fileData.byteLength);
        heapu8.set(fileData, pointerToSrc);
        const pointerToResultSize = wa._my_malloc(4);
        status("Unpacking");

        const pointerToResult = reportTime(() =>
            wa._huffman_decode(pointerToSrc, pointerToResultSize)
        );

        wa._my_free(pointerToSrc);
        status("Unpacking done");
        const size = new Uint32Array(
            heapu8.slice(pointerToResultSize, pointerToResultSize + 4).buffer
        )[0];
        console.info(`Unpacked size = ${size}`);
        wa._my_free(pointerToResultSize);
        const unpackedData = heapu8.slice(
            pointerToResult,
            pointerToResult + size
        );
        wa._my_free(pointerToResult);
        (window as any).unpackedData = unpackedData;
        downloadBuffer(fileName.replace(".huffman", ""), unpackedData);
        toggleButtonsDisabled(false);
        status("Done");
    });

    onInputReadFile(unpackTsInput, (fileData, fileName) => {
        status("Unpacking");
        console.info(`Packed size = ${fileData.byteLength}`);
        const unpacked = reportTime(() => huffmanDecode(fileData));
        console.info(`Unpacked size = ${unpacked.byteLength}`);
        status("Unpacked");
        downloadBuffer(fileName.replace(".huffman", ""), unpacked);
        toggleButtonsDisabled(false);
        status("Done");
    });
    onInputReadFile(packTsInput, (fileData, fileName) => {
        status("Packing");
        console.info(`Unpacked size = ${fileData.byteLength}`);
        const packed = reportTime(() => huffmanEncode(fileData));
        console.info(`Packed size = ${packed.byteLength}`);
        status("Packed");
        downloadBuffer(fileName + ".huffman", packed);
        toggleButtonsDisabled(false);
        status("Done");
    });
}
start().catch(e => {
    console.warn(e);
    status(e.message || "Error");
});
