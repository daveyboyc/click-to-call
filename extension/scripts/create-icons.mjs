import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svg = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- Dark circle background -->
  <circle cx="64" cy="64" r="64" fill="#0d1117"/>
  
  <!-- Phone outline -->
  <rect x="42" y="25" width="44" height="78" rx="8" ry="8" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
  
  <!-- Home button -->
  <circle cx="64" cy="90" r="4" fill="#ffffff"/>
  
  <!-- Lightning bolt - yellow with glow effect -->
  <polygon points="72,45 56,65 64,65 60,83 76,63 68,63" fill="#ffd700"/>
</svg>`;

const sizes = [16, 32, 48, 128];

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

for (const size of sizes) {
  const buffer = await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toBuffer();
  
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), buffer);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buffer);
  console.log(`Created icon-${size}.png (${size}x${size})`);
}

console.log('All icons created!');
