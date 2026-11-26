// Generates the Second Look tombstone PNGs (icon, adaptive icon,
// splash icon, favicon) without any image dependencies — just zlib
// and a tiny PNG encoder. Run: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

// ---------- tiny PNG encoder ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- tombstone raster ----------
const BG = [12, 13, 16, 255];        // #0C0D10
const STONE = [185, 189, 198, 255]; // #B9BDC6
const ENGRAVE = [58, 62, 71, 255];  // #3A3E47
const MOSS = [127, 209, 168, 255];  // #7FD1A8
const GROUND = [42, 46, 55, 255];   // #2A2E37

function lerp(a, b, t) { return a + (b - a) * t; }

/** Draw the tombstone mark into an RGBA buffer of size s×s. transparent: no bg fill. */
function renderTombstone(s, transparent = false) {
  const buf = Buffer.alloc(s * s * 4);
  const px = (x, y, c) => {
    const i = (y * s + x) * 4;
    buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = c[3];
  };
  if (!transparent) for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) px(x, y, BG);

  // geometry (relative units of s)
  const stoneLeft = s * 0.265, stoneRight = s * 0.735;
  const stoneTop = s * 0.205, stoneBottom = s * 0.785;
  const archR = (stoneRight - stoneLeft) / 2;
  const archCx = (stoneLeft + stoneRight) / 2;
  const groundTop = s * 0.785;

  const inStone = (x, y) => {
    if (y < stoneTop || y > stoneBottom || x < stoneLeft || x > stoneRight) return false;
    // arch: above stoneTop + archR, points outside the semicircle are out
    const archBottom = stoneTop + archR;
    if (y < archBottom) {
      const dx = x - archCx, dy = y - archBottom;
      return dx * dx + dy * dy <= archR * archR;
    }
    return true;
  };

  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      if (inStone(x, y)) px(x, y, STONE);
    }
  }
  // engraving bars (centered)
  const bars = [
    [0.30, 0.42, 0.33, 0.031],
    [0.38, 0.47, 0.30, 0.024],
    [0.36, 0.455, 0.35, 0.024],
  ];
  for (const [x0, x1, y0, h] of bars) {
    const bx0 = Math.round(s * x0), bx1 = Math.round(s * x1);
    const by0 = Math.round(s * y0), by1 = Math.round(s * (y0 + h));
    for (let y = by0; y < by1; y++) for (let x = bx0; x < bx1; x++) if (inStone(x, y)) px(x, y, ENGRAVE);
  }
  // moss sprig: two circles on the lower-left stone edge
  const mossBlobs = [[0.29, 0.685, 0.037], [0.325, 0.653, 0.021]];
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    for (const [cx, cy, r] of mossBlobs) {
      const dx = x / s - cx, dy = y / s - cy;
      if (dx * dx + dy * dy <= r * r) px(x, y, MOSS);
    }
  }
  // ground bar
  const gx0 = Math.round(s * 0.20), gx1 = Math.round(s * 0.80);
  for (let y = Math.round(groundTop); y < Math.round(s * 0.79); y++)
    for (let x = gx0; x < gx1; x++) px(x, y, GROUND);
  return buf;
}

mkdirSync('assets/images', { recursive: true });
writeFileSync('assets/images/icon.png', encodePNG(1024, 1024, renderTombstone(1024)));
writeFileSync('assets/images/adaptive-icon.png', encodePNG(1024, 1024, renderTombstone(1024, true)));
writeFileSync('assets/images/splash-icon.png', encodePNG(512, 512, renderTombstone(512, true)));
writeFileSync('assets/images/favicon.png', encodePNG(48, 48, renderTombstone(48, true)));
console.log('Wrote icon.png (1024), adaptive-icon.png, splash-icon.png (512), favicon.png (48)');
