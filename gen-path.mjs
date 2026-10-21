import opentype from "opentype.js";
import fs from "node:fs";

const fontPath = "C:\\Windows\\Fonts\\times.ttf";
const buffer = fs.readFileSync(fontPath);
const font = opentype.parse(buffer);

const text = "И";
const fontSize = 100; // большой размер для точности
const path = font.getPath(text, 0, fontSize, fontSize);
const bb = path.getBoundingBox();

console.log("=== BBOX ===");
console.log(`x1: ${bb.x1}, y1: ${bb.y1}, x2: ${bb.x2}, y2: ${bb.y2}`);
console.log("=== PATH ===");
console.log(path.toPathData(2));
console.log("=== END ===");
