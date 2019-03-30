#/bin/bash
set -e
echo "Building code"
gcc -Wall -o 1 main.c
for f in "zero" "one" "fibonachi10" "fibonachi30" "hpmor_ru.html"; do
 if [ -f "test/$f.tmp" ]; then
   rm "test/$f.tmp" 
 fi
 if [ -f "test/$f.huffman" ]; then
   rm "test/$f.huffman" 
 fi
 echo "Packing 'test/$f' with C packer"
 ./1 "test/$f" "test/$f.tmp" >/dev/null 
 echo "Packing $f with TS packer"
 ./node_modules/.bin/ts-node -T huffman.ts encode "test/$f" "test/$f.huffman" >/dev/null
 echo "Comparing C and TS" 
 cmp -l "test/$f.tmp" "test/$f.huffman" 
 rm "test/$f.tmp"
 echo "Unpacking test/$f.huffman"
 ./node_modules/.bin/ts-node -T huffman.ts decode "test/$f.huffman" "test/$f.tmp" >/dev/null
 echo "Comparing unpacked and original"
 cmp -l "test/$f.tmp" "test/$f" 
 rm "test/$f.huffman"
 rm "test/$f.tmp"
 echo ""
done

echo "Tests done"