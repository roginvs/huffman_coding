#!/bin/bash
set -e
echo "Loading emsdk"
source ../emsdk/emsdk_env.sh
echo "Build WASM"
emcc huffman.c -Os -s ALLOW_MEMORY_GROWTH=1 -s TOTAL_MEMORY=65536 -s TOTAL_STACK=1000 -s ERROR_ON_UNDEFINED_SYMBOLS=1 -o web/huffman.wasm

echo "Building js"
./node_modules/.bin/tsc --module amd --downlevelIteration --outFile web/index.js index.ts


