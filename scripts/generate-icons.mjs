import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

// Run `node scripts/generate-icons.mjs` after editing the SVG master.
const appDirectory = new URL("../src/app/", import.meta.url);
const source = await readFile(new URL("icon.svg", appDirectory));
const sizes = [16, 32, 48, 64, 256];
const images = await Promise.all(
  sizes.map((size) => sharp(source, { density: 384 }).resize(size, size).png().toBuffer()),
);

// ICO directory entries point to PNG payloads, one for each display size.
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;

images.forEach((image, index) => {
  const entry = 6 + index * 16;
  directory[entry] = sizes[index] === 256 ? 0 : sizes[index];
  directory[entry + 1] = directory[entry];
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(image.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});

await writeFile(new URL("favicon.ico", appDirectory), Buffer.concat([directory, ...images]));
await sharp(source, { density: 384 })
  .resize(180, 180)
  .flatten({ background: "#1a1a1a" })
  .png()
  .toFile(new URL("apple-icon.png", appDirectory).pathname);
