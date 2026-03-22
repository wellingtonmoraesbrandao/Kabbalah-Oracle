// Script to resize icon.png to PWA icon sizes
// Run with: npx tsx scripts/resize-icon.ts

import fs from 'fs';
import path from 'path';

// Check if sharp is available, otherwise use canvas approach
async function resizeImage() {
    const iconsDir = path.join(process.cwd(), 'public', 'icons');
    const sourcePath = path.join(iconsDir, 'icon-source.png');

    if (!fs.existsSync(sourcePath)) {
        console.error('Source image not found:', sourcePath);
        process.exit(1);
    }

    // Try to use sharp for resizing
    try {
        const sharp = (await import('sharp')).default;

        const sizes = [
            { name: 'icon-192x192.png', size: 192 },
            { name: 'icon-512x512.png', size: 512 },
            { name: 'apple-touch-icon.png', size: 180 }
        ];

        console.log('Resizing icon.png to PWA sizes...');

        for (const { name, size } of sizes) {
            await sharp(sourcePath)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 107, g: 33, b: 168, alpha: 1 } // Purple background
                })
                .png({ quality: 100 })
                .toFile(path.join(iconsDir, name));

            console.log(`Created ${name} (${size}x${size})`);
        }

        console.log('All icons created successfully!');

    } catch (error) {
        console.log('Sharp not available, using fallback method...');
        await resizeWithCanvas(sourcePath, iconsDir);
    }
}

async function resizeWithCanvas(sourcePath: string, iconsDir: string) {
    // Fallback: just copy the source for now
    // In production, you'd want to use sharp or another image library

    const sizes = [
        { name: 'icon-192x192.png', size: 192 },
        { name: 'icon-512x512.png', size: 512 },
        { name: 'apple-touch-icon.png', size: 180 }
    ];

    const sourceData = fs.readFileSync(sourcePath);

    for (const { name, size } of sizes) {
        // Copy the original image (in production, use sharp)
        fs.copyFileSync(sourcePath, path.join(iconsDir, name));
        console.log(`Copied ${name} (original size, will be scaled by browser)`);
    }

    console.log('Icons copied - for best results, install sharp: npm install sharp');
}

resizeImage().catch(console.error);
