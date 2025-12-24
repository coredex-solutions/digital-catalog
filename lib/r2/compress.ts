import sharp from 'sharp';

export interface CompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  convertToWebP?: boolean;
}

/**
 * Compresses an image buffer using sharp
 * @param buffer - The image buffer to compress
 * @param mimeType - The MIME type of the image (e.g., 'image/png', 'image/jpeg')
 * @param options - Compression options
 * @returns Compressed buffer and updated MIME type
 */
export async function compressImage(
  buffer: Buffer,
  mimeType: string,
  options: CompressionOptions = {}
): Promise<{ buffer: Buffer; mimeType: string; originalSize: number; compressedSize: number }> {
  const {
    quality = 85,
    maxWidth = 1920,
    maxHeight = 1920,
    convertToWebP = false,
  } = options;

  const originalSize = buffer.length;
  let image = sharp(buffer);
  const metadata = await image.metadata();

  // Resize if needed (maintain aspect ratio)
  if (metadata.width && metadata.height) {
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      image = image.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
  }

  let compressedBuffer: Buffer;
  let outputMimeType = mimeType;

  // Convert to WebP if requested
  if (convertToWebP) {
    compressedBuffer = await image.webp({ quality }).toBuffer();
    outputMimeType = 'image/webp';
  } else {
    // Compress based on original format
    if (mimeType === 'image/png') {
      compressedBuffer = await image
        .png({
          quality: Math.min(quality, 100),
          compressionLevel: 9,
          adaptiveFiltering: true,
        })
        .toBuffer();
    } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      compressedBuffer = await image
        .jpeg({
          quality,
          mozjpeg: true,
        })
        .toBuffer();
    } else if (mimeType === 'image/webp') {
      compressedBuffer = await image.webp({ quality }).toBuffer();
    } else {
      // For other formats, try to convert to JPEG
      compressedBuffer = await image.jpeg({ quality, mozjpeg: true }).toBuffer();
      outputMimeType = 'image/jpeg';
    }
  }

  const compressedSize = compressedBuffer.length;
  const savings = ((originalSize - compressedSize) / originalSize) * 100;

  console.log(
    `Image compressed: ${(originalSize / 1024).toFixed(2)} KB → ${(compressedSize / 1024).toFixed(2)} KB (${savings.toFixed(1)}% reduction)`
  );

  return {
    buffer: compressedBuffer,
    mimeType: outputMimeType,
    originalSize,
    compressedSize,
  };
}

