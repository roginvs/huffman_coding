console.info("s");
(async () => {
    TOTAL_MEMORY = 65536 * 10;
    window.memory = new WebAssembly.Memory({
        initial: TOTAL_MEMORY / 65536
    });
    window.heapu8 = new Uint8Array(memory.buffer);
    window.heap32 = new Int32Array(memory.buffer);
    //heap32[0] = 16;
    var DYNAMIC_BASE = 3824;
    var DYNAMICTOP_PTR = 2560;
    heap32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

    window.module = await fetch("huffman.wasm")
        .then(response => response.arrayBuffer())
        .then(bytes => WebAssembly.compile(bytes));
    window.imports = {
        env: {
            ___setErrNo: n => console.error(`Got error ${n}`),
            abortOnCannotGrowMemory: size => {
                throw new Error(`Need ${size} memory`);
            },
            _emscripten_resize_heap: size => {
                console.info(
                    `_emscripten_resize_heap is not implemented, want ${size} memory`
                );
                throw new Error(
                    `_emscripten_resize_heap is not implemented, want ${size} memory`
                );
            },
            _emscripten_memcpy_big(dest, src, num) {
                console.info(`Copy memory ${dest} ${src} ${num}`);
                heapu8.set(heapu8.subarray(src, src + num), dest);
            },
            _emscripten_get_heap_size() {
                console.info(`Get total heap size`);
                return TOTAL_MEMORY;
            },
            get DYNAMICTOP_PTR() {
                // What's this for?
                console.info("Get DYNAMICTOP_PTR");
                return DYNAMICTOP_PTR;
            },
            memory
        }
    };
    window.inst = await WebAssembly.instantiate(module, imports);

    console.info("loaded");
    return;
    window.l = inst.exports._createList();
    for (window.i = 0; i < 500000; i++) {
        inst.exports._push(l, i);
    }
})();
