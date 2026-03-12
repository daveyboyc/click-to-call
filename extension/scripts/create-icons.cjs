const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 128];

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background - dark circle
  ctx.fillStyle = '#0d1117';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.fill();

  // Phone - white outline style
  const phoneW = size * 0.35;
  const phoneH = size * 0.55;
  const phoneX = (size - phoneW) / 2;
  const phoneY = (size - phoneH) / 2;
  
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.06;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.roundRect(phoneX, phoneY, phoneW, phoneH, size * 0.08);
  ctx.stroke();

  // Home button
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(size/2, phoneY + phoneH - size*0.08, size*0.03, 0, Math.PI*2);
  ctx.fill();

  // Lightning bolt - yellow with glow
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = size * 0.12;
  ctx.fillStyle = '#ffd700';
  
  const bx = size/2;
  const by = size/2;
  const bs = size * 0.22;
  
  ctx.beginPath();
  ctx.moveTo(bx + bs*0.15, by - bs*0.5);
  ctx.lineTo(bx - bs*0.25, by + bs*0.05);
  ctx.lineTo(bx - bs*0.05, by + bs*0.05);
  ctx.lineTo(bx - bs*0.15, by + bs*0.5);
  ctx.lineTo(bx + bs*0.25, by - bs*0.05);
  ctx.lineTo(bx + bs*0.05, by - bs*0.05);
  ctx.closePath();
  ctx.fill();

  return canvas.toBuffer('image/png');
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const buffer = createIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), buffer);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buffer);
  console.log(`Created icon-${size}.png`);
});

console.log('All icons created!');
