import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const DEFAULT_INPUTS = [
  "./public/baniere/baniere.png",
  "./public/baniere/process.png",
  "./public/baniere/loire.png",
  "./public/baniere/foret.png",
  "./public/baniere/chateaux.png",
  "./public/baniere/sully.png",
  "./public/logo-allo-moto.png",
];

const BANNER_WIDTHS = [2560, 1920, 1536, 1024, 768];
const LOGO_WIDTHS = [512, 256, 128];
const AVIF_Q = 55;
const WEBP_Q = 78;
const BLUR_W = 24;
const BLUR_Q = 25;
const IMG_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

function isImageFile(filePath) {
  return IMG_EXT.has(path.extname(filePath).toLowerCase());
}

async function exists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function buildDerivatives(inputPath, widths) {
  const outDir = path.dirname(inputPath);
  const base = path.basename(inputPath, path.extname(inputPath));

  for (const width of widths) {
    const avifOut = path.join(outDir, `${base}-${width}.avif`);
    const webpOut = path.join(outDir, `${base}-${width}.webp`);

    await sharp(inputPath).resize({ width }).avif({ quality: AVIF_Q }).toFile(avifOut);
    await sharp(inputPath).resize({ width }).webp({ quality: WEBP_Q }).toFile(webpOut);

    console.log(`  + ${avifOut}`);
    console.log(`  + ${webpOut}`);
  }

  const blurOut = path.join(outDir, `${base}-blur.webp`);
  await sharp(inputPath).resize({ width: BLUR_W }).webp({ quality: BLUR_Q }).toFile(blurOut);
  console.log(`  + ${blurOut}`);
}

function getWidthsForInput(inputPath) {
  return path.basename(inputPath) === "logo-allo-moto.png"
    ? LOGO_WIDTHS
    : BANNER_WIDTHS;
}

async function processOne(inputPath) {
  if (!isImageFile(inputPath)) {
    console.log(`(skip) unsupported file: ${inputPath}`);
    return;
  }

  if (!(await exists(inputPath))) {
    console.log(`(skip) missing file: ${inputPath}`);
    return;
  }

  console.log(`-> ${inputPath}`);
  await buildDerivatives(inputPath, getWidthsForInput(inputPath));
}

async function main() {
  const targets = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_INPUTS;

  for (const target of targets) {
    const inputPath = path.resolve(target);
    await processOne(inputPath);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
