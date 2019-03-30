#!/bin/bash
set -e
source ../emsdk/emsdk_env.sh
emcc huffman.c -Os -s ALLOW_MEMORY_GROWTH=1 -s TOTAL_MEMORY=65536 -s TOTAL_STACK=1000 -s ERROR_ON_UNDEFINED_SYMBOLS=1 -o web/huffman.wasm

