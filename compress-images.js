import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, 'public');

async function compressImages() {
  try {
    console.log('🔍 Finding images to compress...\n');
    
    const files = await readdir(publicDir);
    const imageFiles = files.filter(file => {
      const ext = extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
    });

    if (imageFiles.length === 0) {
      console.log('❌ No images found to compress.');
      return;
    }

    console.log(`📦 Found ${imageFiles.length} image(s) to compress:\n`);
    
    for (const file of imageFiles) {
      const inputPath = join(publicDir, file);
      const fileStats = await stat(inputPath);
      const originalSize = (fileStats.size / 1024).toFixed(2); // KB
      
      console.log(`⏳ Compressing: ${file} (${originalSize} KB)`);
      
      try {
        // Create optimized version
        const image = sharp(inputPath);
        const metadata = await image.metadata();
        
        // Create temporary output path
        const tempPath = join(publicDir, `temp_${file}`);
        let optimizedImage = image;
        
        // For PNG files, compress them
        if (metadata.format === 'png') {
          optimizedImage = image.png({ 
            quality: 80,
            compressionLevel: 9,
            adaptiveFiltering: true,
          });
        } 
        // For JPEG files, compress them
        else if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
          optimizedImage = image.jpeg({ 
            quality: 85,
            mozjpeg: true,
          });
        }
        // For WebP, optimize it
        else if (metadata.format === 'webp') {
          optimizedImage = image.webp({ 
            quality: 85,
          });
        }
        
        // Write to temp file first
        await optimizedImage.toFile(tempPath);
        
        // Replace original with compressed version
        const { rename } = await import('fs/promises');
        await rename(tempPath, inputPath);
        
        const newStats = await stat(inputPath);
        const newSize = (newStats.size / 1024).toFixed(2); // KB
        const saved = ((fileStats.size - newStats.size) / fileStats.size * 100).toFixed(1);
        
        console.log(`✅ Compressed: ${file}`);
        console.log(`   Before: ${originalSize} KB → After: ${newSize} KB (Saved: ${saved}%)\n`);
        
      } catch (error) {
        console.error(`❌ Error compressing ${file}:`, error.message);
      }
    }
    
    console.log('✨ Image compression complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

compressImages();
