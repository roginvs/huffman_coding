#/bin/bash
set -e
echo "Building code"
gcc -Wall -o main main.c
for f in "zero" "one" "fibonachi10" "fibonachi30" "hpmor_ru.html"; do
 echo "==== Testing 'test/$f' file ===="
 for tmp in "test/$f.C.tmp" "test/$f.TS.tmp" "test/$f.C.huffman" "test/$f.TS.huffman" ; do
   if [ -f "$tmp" ]; then
     rm "$tmp" 
   fi
 done

 echo "== Packing with C packer =="
 ./main encode "test/$f" "test/$f.C.huffman"
 
 echo "== Unpacking with C unpacker =="
 ./main decode "test/$f.C.huffman" "test/$f.C.tmp"

 echo "== Comparing C unpacked and original =="
 cmp -l "test/$f.C.tmp" "test/$f"

 echo "== Packing with TS packer =="
 ./node_modules/.bin/ts-node -T main.ts encode "test/$f" "test/$f.TS.huffman"
 echo "== Comparing packed C and TS ==" 
 cmp -l "test/$f.C.huffman" "test/$f.TS.huffman" 

 echo "== Unpacking with TS unpacker =="
 ./node_modules/.bin/ts-node -T main.ts decode "test/$f.TS.huffman" "test/$f.TS.tmp"
 echo "== Comparing TS unpacked and original =="
 cmp -l "test/$f.TS.tmp" "test/$f" 

 echo "== Cleaning tmp files =="
 for tmp in "test/$f.C.tmp" "test/$f.TS.tmp" "test/$f.C.huffman" "test/$f.TS.huffman" ; do 
   rm "$tmp" 
  done  
 echo ""
done

echo "Tests done"