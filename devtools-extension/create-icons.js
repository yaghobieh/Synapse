const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [16, 48, 128];

function drawIcon(ctx, size) {
  const scale = size / 128;
  
  // Background (optional, can be transparent)
  ctx.clearRect(0, 0, size, size);
  
  // Body gradient
  const bodyGrad = ctx.createLinearGradient(64 * scale, 12 * scale, 64 * scale, 76 * scale);
  bodyGrad.addColorStop(0, '#66d9ef');
  bodyGrad.addColorStop(1, '#4a9eb8');
  
  // Head
  ctx.beginPath();
  ctx.ellipse(64 * scale, 44 * scale, 36 * scale, 32 * scale, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  
  // Eyes (white)
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.ellipse(50 * scale, 40 * scale, 8 * scale, 10 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(78 * scale, 40 * scale, 8 * scale, 10 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Pupils
  ctx.fillStyle = '#2f3129';
  ctx.beginPath();
  ctx.arc(52 * scale, 42 * scale, 4 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(80 * scale, 42 * scale, 4 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Eye highlights
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(53 * scale, 41 * scale, 1.5 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(81 * scale, 41 * scale, 1.5 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // State box
  ctx.fillStyle = '#a6e22e';
  ctx.globalAlpha = 0.9;
  roundRect(ctx, 46 * scale, 56 * scale, 36 * scale, 28 * scale, 4 * scale);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // {S} text
  ctx.fillStyle = '#2f3129';
  ctx.font = `bold ${10 * scale}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('{S}', 64 * scale, 70 * scale);
  
  // Tentacles
  const tentacleGrad = ctx.createLinearGradient(0, 76 * scale, 0, 120 * scale);
  tentacleGrad.addColorStop(0, '#4a9eb8');
  tentacleGrad.addColorStop(1, '#357a8c');
  
  ctx.strokeStyle = tentacleGrad;
  ctx.lineCap = 'round';
  
  // Left tentacles
  drawTentacle(ctx, scale, 28, 76, 20, 90, 16, 105, 14, 115, 22, 118, 8);
  drawTentacle(ctx, scale, 38, 80, 28, 95, 24, 108, 22, 118, 30, 120, 7);
  drawTentacle(ctx, scale, 46, 82, 40, 95, 38, 108, 36, 118, 44, 120, 6);
  
  // Right tentacles
  drawTentacle(ctx, scale, 100, 76, 108, 90, 112, 105, 114, 115, 106, 118, 8);
  drawTentacle(ctx, scale, 90, 80, 100, 95, 104, 108, 106, 118, 98, 120, 7);
  drawTentacle(ctx, scale, 82, 82, 88, 95, 90, 108, 92, 118, 84, 120, 6);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawTentacle(ctx, scale, x1, y1, cx1, cy1, cx2, cy2, x2, _y2, x3, y3, width) {
  ctx.lineWidth = width * scale;
  ctx.beginPath();
  ctx.moveTo(x1 * scale, y1 * scale);
  ctx.quadraticCurveTo(cx1 * scale, cy1 * scale, cx2 * scale, cy2 * scale);
  ctx.quadraticCurveTo(x2 * scale, cy2 * scale, x3 * scale, y3 * scale);
  ctx.stroke();
}

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  drawIcon(ctx, size);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icons/icon${size}.png`, buffer);
  console.log(`Created icon${size}.png`);
});

console.log('Done! Now run: npm run build');

