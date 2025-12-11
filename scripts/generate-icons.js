/**
 * PWA Icon Generator Script
 * Run with: node scripts/generate-icons.js
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = join(__dirname, '..', 'public', 'icons');
const publicDir = join(__dirname, '..', 'public');

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// SVG source for the icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bgGradient)"/>
  <rect x="96" y="128" width="320" height="288" rx="24" fill="white" opacity="0.95"/>
  <rect x="96" y="128" width="320" height="64" rx="24" fill="white"/>
  <rect x="96" y="168" width="320" height="24" fill="white"/>
  <rect x="160" y="104" width="16" height="48" rx="8" fill="#4f46e5"/>
  <rect x="336" y="104" width="16" height="48" rx="8" fill="#4f46e5"/>
  <g transform="translate(256, 296)">
    <path d="M-48 0 A48 48 0 1 1 0 48" stroke="#6366f1" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M48 0 A48 48 0 1 1 0 -48" stroke="#6366f1" stroke-width="16" fill="none" stroke-linecap="round"/>
    <polygon points="-48,-20 -48,20 -28,0" fill="#6366f1"/>
    <polygon points="48,20 48,-20 28,0" fill="#6366f1"/>
  </g>
  <text x="256" y="220" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#4f46e5" text-anchor="middle">$</text>
</svg>`;

// Maskable icon with safe zone padding
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#6366f1"/>
  <g transform="translate(64, 64) scale(0.75)">
    <rect x="96" y="128" width="320" height="288" rx="24" fill="white" opacity="0.95"/>
    <rect x="96" y="128" width="320" height="64" rx="24" fill="white"/>
    <rect x="96" y="168" width="320" height="24" fill="white"/>
    <rect x="160" y="104" width="16" height="48" rx="8" fill="#4f46e5"/>
    <rect x="336" y="104" width="16" height="48" rx="8" fill="#4f46e5"/>
    <g transform="translate(256, 296)">
      <path d="M-48 0 A48 48 0 1 1 0 48" stroke="#6366f1" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="M48 0 A48 48 0 1 1 0 -48" stroke="#6366f1" stroke-width="16" fill="none" stroke-linecap="round"/>
      <polygon points="-48,-20 -48,20 -28,0" fill="#6366f1"/>
      <polygon points="48,20 48,-20 28,0" fill="#6366f1"/>
    </g>
    <text x="256" y="220" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#4f46e5" text-anchor="middle">$</text>
  </g>
</svg>`;

async function generateIcons() {
  console.log('Generating PWA icons...\n');

  // Generate standard icons
  for (const size of sizes) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated icon-${size}x${size}.png`);
  }

  // Generate maskable icon
  const maskablePath = join(iconsDir, 'icon-512x512-maskable.png');
  await sharp(Buffer.from(svgMaskable))
    .resize(512, 512)
    .png()
    .toFile(maskablePath);
  console.log('✓ Generated icon-512x512-maskable.png');

  // Generate apple-touch-icon
  const appleTouchPath = join(publicDir, 'apple-touch-icon.png');
  await sharp(Buffer.from(svgIcon))
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);
  console.log('✓ Generated apple-touch-icon.png');

  // Generate favicon
  const faviconPath = join(publicDir, 'favicon.ico');
  await sharp(Buffer.from(svgIcon))
    .resize(32, 32)
    .png()
    .toFile(faviconPath);
  console.log('✓ Generated favicon.ico');

  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(console.error);
