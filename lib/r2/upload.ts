import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client, getR2BucketName, getR2PublicUrl } from './client';
import { randomUUID } from 'crypto';
import { compressImage, CompressionOptions } from './compress';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export async function uploadToR2(
  file: File,
  folder: string = 'categories',
  onProgress?: (progress: UploadProgress) => void,
  compressionOptions?: CompressionOptions
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);
  let contentType = file.type;
  let fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';

  // Compress image if it's an image file
  if (file.type.startsWith('image/')) {
    try {
      const compressed = await compressImage(buffer, file.type, compressionOptions);
      buffer = Buffer.from(compressed.buffer);
      contentType = compressed.mimeType;
      
      // Update file extension if converted to WebP
      if (compressed.mimeType === 'image/webp') {
        fileExtension = 'webp';
      } else if (compressed.mimeType === 'image/jpeg') {
        fileExtension = 'jpg';
      } else if (compressed.mimeType === 'image/png') {
        fileExtension = 'png';
      }
    } catch (error) {
      console.error('Error compressing image, using original:', error);
      // Continue with original buffer if compression fails
    }
  }

  const fileName = `${folder}/${randomUUID()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: getR2BucketName(),
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  // Simulate progress for small files
  if (onProgress) {
    const total = buffer.length;
    let loaded = 0;
    const interval = setInterval(() => {
      loaded = Math.min(loaded + total / 10, total);
      onProgress({
        loaded,
        total,
        percentage: Math.round((loaded / total) * 100),
      });
      if (loaded >= total) {
        clearInterval(interval);
      }
    }, 50);
  }

  await getR2Client().send(command);

  if (onProgress) {
    onProgress({
      loaded: buffer.length,
      total: buffer.length,
      percentage: 100,
    });
  }

  const publicUrl = getR2PublicUrl();
  
  // publicUrl already includes bucket name in the default format
  // Format: https://pub-{account-id}.r2.dev/{bucket-name}
  // So we just append the file path
  return `${publicUrl}/${fileName}`;
}

/**
 * Upload a buffer directly to R2 (for server-side uploads)
 */
export async function uploadBufferToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getR2BucketName(),
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  await getR2Client().send(command);

  const publicUrl = getR2PublicUrl();
  return `${publicUrl}/${key}`;
}

export async function deleteFromR2(fileUrl: string): Promise<void> {
  const publicUrl = getR2PublicUrl();
  const bucketName = getR2BucketName();
  
  // Extract the key from the URL
  // Handle both formats: with and without bucket name in URL
  let key = fileUrl;
  
  // Remove the base public URL
  if (fileUrl.startsWith(publicUrl)) {
    key = fileUrl.replace(publicUrl, '');
  }
  
  // Remove leading slash and bucket name if present
  key = key.replace(/^\/+/, ''); // Remove leading slashes
  if (key.startsWith(`${bucketName}/`)) {
    key = key.replace(`${bucketName}/`, '');
  }
  
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await getR2Client().send(command);
}

