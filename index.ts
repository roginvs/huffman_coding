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
console.info("Starting");
status("Starting");
async function start() {
    const TOTAL_MEMORY = 65536 * 1000;
    const memory = new WebAssembly.Memory({
        initial: TOTAL_MEMORY / 65536
    });
    const heapu8 = new Uint8Array(memory.buffer);
    (window as any).heapu8 = heapu8;
    const heap32 = new Int32Array(memory.buffer);

    //heap32[0] = 16;
    const DYNAMIC_BASE = 3824;
    const DYNAMICTOP_PTR = 2560;
    heap32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

    status("Fetching and building");
    const module = await fetch("huffman.wasm")
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
            _emscripten_memcpy_big(dest: any, src: any, num: any) {
                console.info(`Copy memory ${dest} ${src} ${num}`);
                heapu8.set(heapu8.subarray(src, src + num), dest);
            },
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
    const inst = await WebAssembly.instantiate(module, imports);
    const wa = inst.exports as {
        _huffman_encode: (
            pointerToInput: number,
            inputLength: number,
            pointerToResultOutput: number
        ) => number;
        _my_malloc: (size: number) => number;
        _my_free: (pointerToFree: number) => void;
    };
    (window as any).wa = wa;
    console.info(inst.exports);
    status("Ready");
    console.info("loaded");

    packWaInput.onchange = e => {
        status("Busy");
        const file = packWaInput.files ? packWaInput.files[0] : undefined;
        if (!file) {
            status("No file");
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
                const ab = result as ArrayBuffer;
                const abView = new Uint8Array(ab);
                console.info(`Source size = ${abView.byteLength}`);
                status("Allocating");
                const pointerToSrc = wa._my_malloc(abView.byteLength);
                heapu8.set(abView, pointerToSrc);
                const pointerToResultSize = wa._my_malloc(4);
                status("Packing");
                const pointerToResult = wa._huffman_encode(
                    pointerToSrc,
                    abView.byteLength,
                    pointerToResultSize
                );
                wa._my_free(pointerToSrc);
                status("Packing done");
                const size = new Uint32Array(
                    heapu8.slice(
                        pointerToResultSize,
                        pointerToResultSize + 4
                    ).buffer
                )[0];
                console.info(`Packed size = ${size}`);
                wa._my_free(pointerToResultSize);
                const packedData = heapu8.slice(
                    pointerToResult,
                    pointerToResult + size
                );
                wa._my_free(pointerToResult);
                (window as any).packedData = packedData;
                const objectUrl = URL.createObjectURL(
                    new Blob([packedData.buffer], {
                        type: "application/octet-stream"
                    })
                );
                const link = document.createElement("a");
                link.style.display = "none";
                document.body.appendChild(link);
                link.href = objectUrl;
                link.download = file.name + ".huffman";
                link.click();
                URL.revokeObjectURL(objectUrl);
                status("Done");
            } catch (e) {
                status(e.message || "ERROR");
            }
        };
        reader.onerror = () => status("Reader error");
        reader.readAsArrayBuffer(file);
    };
}
start().catch(e => {
    status(e.message || "Error");
});
