import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { requireAuth } from '../../../../lib/auth/middleware';
import { uploadToR2 } from '../../../../lib/r2/upload';

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if ('error' in auth) {
      return auth.error;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'categories';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB before compression)
    // After compression, files should be much smaller
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Compression options - optimized for restaurant menu images
    // These reduce storage costs while Next.js Image handles responsive serving
    const compressionOptions = {
      quality: parseInt(process.env.R2_IMAGE_QUALITY || '82'), // 82 is optimal for food photos
      maxWidth: parseInt(process.env.R2_IMAGE_MAX_WIDTH || '2048'), // Max width for high-res displays
      maxHeight: parseInt(process.env.R2_IMAGE_MAX_HEIGHT || '2048'), // Max height for high-res displays
      convertToWebP: process.env.R2_CONVERT_TO_WEBP === 'true', // Optional: convert all to WebP
    };

    const url = await uploadToR2(file, folder, undefined, compressionOptions);

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    
    // Provide more specific error messages
    if (error.name === 'SignatureDoesNotMatch') {
      console.error('R2 Signature Error - Check your credentials:');
      console.error('- R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID ? 'Set' : 'Missing');
      console.error('- R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? 'Set' : 'Missing');
      console.error('- R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? 'Set' : 'Missing');
      console.error('- R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME ? 'Set' : 'Missing');
      
      return NextResponse.json(
        { 
          error: 'R2 authentication failed. Please verify your R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME) in Netlify environment variables.' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

