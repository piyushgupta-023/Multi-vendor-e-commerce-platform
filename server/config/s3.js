const { S3Client } = require('@aws-sdk/client-s3');

let s3Client = null;
let isConfigured = false;

const createS3Client = () => {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || AWS_ACCESS_KEY_ID === 'your_aws_access_key') {
    console.warn('⚠️  AWS S3 not configured, image uploads will store locally');
    return;
  }
  try {
    s3Client = new S3Client({
      region: AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
    isConfigured = true;
    console.log('✅ AWS S3 Client initialized');
  } catch (err) {
    console.warn('⚠️  AWS S3 init failed:', err.message);
  }
};

createS3Client();

module.exports = {
  getClient: () => s3Client,
  isS3Configured: () => isConfigured,
  BUCKET: process.env.AWS_S3_BUCKET || 'marketplace-products',
};
