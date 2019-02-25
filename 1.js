/*
I used this to test C functions
*/

const fs = require("fs");
b = fs.readFileSync("hpmor_ru.html");
const totals = new Array(256).fill(0);
for (let i = 0; i < b.length; i++) {
    totals[b[i]]++;
}
const info = totals
    .map((count, idx) => ({ count, idx }))
    .sort((a, b) => a.count - b.count || a.idx - b.idx);
console.info("totals=", JSON.stringify(info, null, 4));
