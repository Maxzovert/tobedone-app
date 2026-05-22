/**
 * Generates app icon / splash PNGs from assets/tobedone-logo.svg
 * Run: node scripts/generate-brand-assets.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = join(root, "assets", "tobedone-logo.svg");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Install sharp first: npm install --save-dev sharp");
    process.exit(1);
  }

  const svg = readFileSync(svgPath);
  const assets = join(root, "assets");

  const iconSize = 1024;
  const logoOnCanvas = await sharp(svg)
    .resize(Math.round(iconSize * 0.55), Math.round(iconSize * 0.66), {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const icon = await sharp({
    create: {
      width: iconSize,
      height: iconSize,
      channels: 4,
      background: { r: 244, g: 246, b: 250, alpha: 1 },
    },
  })
    .composite([{ input: logoOnCanvas, gravity: "center" }])
    .png()
    .toBuffer();

  writeFileSync(join(assets, "icon.png"), icon);
  writeFileSync(join(assets, "adaptive-icon.png"), icon);
  writeFileSync(join(assets, "splash-icon.png"), icon);

  console.log("Wrote assets/icon.png, adaptive-icon.png, splash-icon.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
