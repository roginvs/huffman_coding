///// <reference path="./webassembly.d.ts" />
// import { huffmanEncode, huffmanDecode } from "./huffman";

function byId(id) {
    const e = document.getElementById(id);
    if (!e) {
        throw new Error("Not found!");
    }
    return e;
}
const statusDiv = byId("status");
function status(text) {
    statusDiv.innerText = text;
}

const packWaInput = byId("pack-wa-input");
const unpackWaInput = byId("unpack-wa-input");
const packTsInput = byId("pack-ts-input");
const unpackTsInput = byId("unpack-ts-input");
console.info("Starting");
status("Starting");

function toggleButtonsDisabled(isDisabled) {
    // document.querySelectorAll("button").forEach(b => (b.disabled = isDisabled));
    document.querySelectorAll(".container").forEach(elem => {
        if (elem instanceof HTMLElement) {
            elem.style.display = isDisabled ? "none" : "";
        }
    });
}

function downloadBuffer(name, data) {
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

function onInputReadFile(input, callback) {
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
                const arrayBuf = result;
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
function reportTime(run) {
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
function start() {
    console.info("Start with emcc js");
    onInputReadFile(packWaInput, (fileData, fileName) => {
        console.info(`Source size = ${fileData.byteLength}`);
        status("Allocating");
        const pointerToSrc = Module._my_malloc(fileData.byteLength);
        Module.HEAPU8.set(fileData, pointerToSrc);
        const pointerToResultSize = Module._my_malloc(4);
        status("Packing");

        const pointerToResult = reportTime(() =>
            Module._huffman_encode(
                pointerToSrc,
                fileData.byteLength,
                pointerToResultSize
            )
        );

        Module._my_free(pointerToSrc);
        status("Packing done");
        const size = new Uint32Array(
            Module.HEAPU8.slice(
                pointerToResultSize,
                pointerToResultSize + 4
            ).buffer
        )[0];
        console.info(`Packed size = ${size}`);
        Module._my_free(pointerToResultSize);
        const packedData = Module.HEAPU8.slice(
            pointerToResult,
            pointerToResult + size
        );
        Module._my_free(pointerToResult);
        window.packedData = packedData;
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
        window.unpackedData = unpackedData;
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
