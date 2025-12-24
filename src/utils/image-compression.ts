/**
 * Image compression utility using browser-image-compression
 * Automatically compresses images before upload to stay under size limits
 */

import imageCompression from "browser-image-compression";

export interface CompressionOptions {
  maxSizeMB?: number; // Max file size in MB (default: 2)
  maxWidthOrHeight?: number; // Max dimension (default: 2048)
  useWebWorker?: boolean; // Use web worker for compression (default: true)
  quality?: number; // Image quality 0-1 (default: 0.8)
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  wasCompressed: boolean;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 2,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
  quality: 0.8,
};

/**
 * Compress an image file if it exceeds the size limit
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;
  const maxSizeBytes = (opts.maxSizeMB || 2) * 1024 * 1024;

  // If file is already under limit, return as-is
  if (originalSize <= maxSizeBytes) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      wasCompressed: false,
    };
  }

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: opts.maxSizeMB,
      maxWidthOrHeight: opts.maxWidthOrHeight,
      useWebWorker: opts.useWebWorker,
      initialQuality: opts.quality,
      fileType: file.type as
        | "image/jpeg"
        | "image/png"
        | "image/webp"
        | undefined,
    });

    // Preserve original filename
    const finalFile = new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });

    return {
      file: finalFile,
      originalSize,
      compressedSize: finalFile.size,
      compressionRatio: originalSize / finalFile.size,
      wasCompressed: true,
    };
  } catch (error) {
    console.error("Image compression failed:", error);
    // Return original file if compression fails
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      wasCompressed: false,
    };
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * Create a preview URL for an image file
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free memory
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}
