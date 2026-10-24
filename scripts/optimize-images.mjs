// Resize licensed web assets without generating or changing scene content.
// Original works, authors, licenses and subject-specific captions remain linked
// in public/data/verified.json and ATTRIBUTIONS.md.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { readFile, writeFile, stat } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const data = JSON.parse(
  await readFile(new URL("public/data/verified.json", root), "utf8"),
);
let total = 0;
for (const peak of data.peaks) {
  const file = new URL(`public/${peak.photo.localPath}`, root);
  const metadata = await sharp(fileURLToPath(file)).metadata();
  if (metadata.width > 1200 || metadata.height > 1000) {
    const buffer = await sharp(fileURLToPath(file))
      .rotate()
      .resize({
        width: 1200,
        height: 1000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    await writeFile(file, buffer);
  }
  total += (await stat(file)).size;
}
console.log(
  `10 licensed photographs: ${(total / 1024 / 1024).toFixed(2)} MiB total`,
);
