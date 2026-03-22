// Script to generate PWA icons
// Run with: npx tsx scripts/generate-pwa-icons.ts

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Simple PNG generator - creates solid color icons with text
function createPNG(width: number, height: number): Buffer {
    // PNG file structure
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    // IHDR chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);  // width
    ihdrData.writeUInt32BE(height, 4); // height
    ihdrData.writeUInt8(8, 8);         // bit depth
    ihdrData.writeUInt8(2, 9);         // color type (RGB)
    ihdrData.writeUInt8(0, 10);        // compression
    ihdrData.writeUInt8(0, 11);        // filter
    ihdrData.writeUInt8(0, 12);        // interlace

    const ihdr = createChunk('IHDR', ihdrData);

    // IDAT chunk - create simple purple/mystical gradient image
    const rawData: number[] = [];
    for (let y = 0; y < height; y++) {
        rawData.push(0); // filter byte
        for (let x = 0; x < width; x++) {
            // Create mystical purple gradient with star pattern
            const centerX = width / 2;
            const centerY = height / 2;
            const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
            const ratio = dist / maxDist;

            // Base color: mystical purple (#6B21A8)
            let r = 107;
            let g = 33;
            let b = 168;

            // Add gradient effect
            r = Math.floor(r * (1 - ratio * 0.5));
            g = Math.floor(g * (1 - ratio * 0.5));
            b = Math.floor(b * (1 - ratio * 0.2));

            // Add star pattern in center
            const starX = centerX;
            const starY = centerY;
            const starDist = Math.sqrt((x - starX) ** 2 + (y - starY) ** 2);
            if (starDist < width * 0.15) {
                // Bright star center
                r = 255;
                g = 215;
                b = 0;
            } else if (starDist < width * 0.25) {
                // Glowing ring
                r = Math.min(255, r + 80);
                g = Math.min(255, g + 60);
                b = Math.min(255, b + 40);
            }

            rawData.push(r, g, b);
        }
    }

    const compressed = zlib.deflateSync(Buffer.from(rawData));
    const idat = createChunk('IDAT', compressed);

    // IEND chunk
    const iend = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type: string, data: Buffer): Buffer {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const typeBuffer = Buffer.from(type);
    const crcData = Buffer.concat([typeBuffer, data]);

    // Calculate CRC32
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < crcData.length; i++) {
        crc ^= crcData[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
        }
    }
    crc ^= 0xFFFFFFFF;

    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc >>> 0, 0);

    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// Generate icons
const iconsDir = path.join(process.cwd(), 'public', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate different sizes
const sizes = [
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 }
];

console.log('Generating PWA icons...');

for (const { name, size } of sizes) {
    const png = createPNG(size, size);
    const filePath = path.join(iconsDir, name);
    fs.writeFileSync(filePath, png);
    console.log(`Created ${name} (${size}x${size})`);
}

console.log('All icons generated successfully!');
