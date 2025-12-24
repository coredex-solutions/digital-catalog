import { S3Client } from '@aws-sdk/client-s3';

function getR2Config() {
  if (!process.env.R2_ACCOUNT_ID) {
    throw new Error('R2_ACCOUNT_ID is not set');
  }

  if (!process.env.R2_ACCESS_KEY_ID) {
    throw new Error('R2_ACCESS_KEY_ID is not set');
  }

  if (!process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2_SECRET_ACCESS_KEY is not set');
  }

  if (!process.env.R2_BUCKET_NAME) {
    throw new Error('R2_BUCKET_NAME is not set');
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const bucketName = process.env.R2_BUCKET_NAME;
  
  return {
    accountId,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName,
    publicUrl: process.env.R2_PUBLIC_URL || `https://pub-${accountId}.r2.dev/${bucketName}`,
  };
}

let r2ClientInstance: S3Client | null = null;

export function getR2Client() {
  if (!r2ClientInstance) {
    const config = getR2Config();
    r2ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: false,
    });
  }
  return r2ClientInstance;
}

export function getR2BucketName() {
  return getR2Config().bucketName;
}

export function getR2PublicUrl() {
  return getR2Config().publicUrl;
}

