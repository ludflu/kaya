#!/usr/bin/env bun
/**
 * Generate PWA icons and Open Graph image
 * Requires: bun install sharp
 */

import sharp from 'sharp';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const publicDir = join(import.meta.dir, '..', 'public');
const logoPath = join(publicDir, 'logo.png');

async function generatePWAIcons() {
  console.log('🎨 Generating PWA icons...');

  if (!existsSync(logoPath)) {
    console.error('❌ Logo not found at:', logoPath);
    process.exit(1);
  }

  const sizes = [192, 512];

  for (const size of sizes) {
    const outputPath = join(publicDir, `icon-${size}.png`);
    await sharp(logoPath).resize(size, size).toFile(outputPath);
    console.log(`✅ Generated ${size}x${size} icon`);
  }
}

async function generateOGImage() {
  console.log('🖼️  Generating Open Graph image...');

  const width = 1200;
  const height = 630;
  const logoSize = 200;
  const backgroundColor = '#f5f5f0';
  const textColor = '#2d5016';

  // Create SVG text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
      
      <!-- Logo placeholder (centered top) -->
      <rect x="${(width - logoSize) / 2}" y="120" width="${logoSize}" height="${logoSize}" fill="${textColor}" opacity="0.1" rx="20"/>
      
      <!-- Title -->
      <text x="${width / 2}" y="400" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="bold" fill="${textColor}" text-anchor="middle">
        Kaya
      </text>
      
      <!-- Subtitle -->
      <text x="${width / 2}" y="470" font-family="system-ui, -apple-system, sans-serif" font-size="32" fill="${textColor}" text-anchor="middle" opacity="0.8">
        Modern Go Game Application
      </text>
      
      <!-- Description -->
      <text x="${width / 2}" y="530" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="${textColor}" text-anchor="middle" opacity="0.6">
        Beautiful interface • SGF support • Game tree navigation
      </text>
    </svg>
  `;

  const outputPath = join(publicDir, 'og-image.png');

  // Generate base image from SVG
  const baseImage = await sharp(Buffer.from(svg)).png().toBuffer();

  // Resize logo to fit
  const logo = await sharp(logoPath).resize(logoSize, logoSize).toBuffer();

  // Composite logo on top of base image
  await sharp(baseImage)
    .composite([
      {
        input: logo,
        top: 120,
        left: (width - logoSize) / 2,
      },
    ])
    .toFile(outputPath);

  console.log('✅ Generated Open Graph image (1200x630)');
}

async function main() {
  try {
    await generatePWAIcons();
    await generateOGImage();
    console.log('✨ All images generated successfully!');
  } catch (error) {
    console.error('❌ Error generating images:', error);
    process.exit(1);
  }
}

main();
