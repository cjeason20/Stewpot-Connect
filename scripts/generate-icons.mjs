import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');

const svgBuffer = readFileSync(join(publicDir, 'icon.svg'));

const icons = [
  // PWA / manifest
  { name: 'icon-192.png',  size: 192 },
  { name: 'icon-512.png',  size: 512 },
  // Apple Touch Icon (iPhone home screen)
  { name: 'apple-touch-icon.png', size: 180 },
  // Favicon sizes
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-16.png', size: 16 },
];

console.log('Generating icons from icon.svg...\n');

for (const { name, size } of icons) {
  const outPath = join(publicDir, name);
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`  ✓  ${name}  (${size}×${size})`);
}

// Also generate a favicon.ico-compatible 32px png (browsers accept .ico or .png)
console.log('\nAll icons generated in public/');
