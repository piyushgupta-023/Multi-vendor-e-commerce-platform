const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getClient, isS3Configured, BUCKET } = require('../config/s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Ensure local upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Upload a file buffer to S3 or local storage as fallback
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} mimetype - MIME type
 * @param {string} folder - S3 folder prefix (e.g., 'products', 'avatars')
 * @returns {Promise<{ url: string, key: string, filename: string }>}
 */
const uploadFile = async (buffer, originalName, mimetype, folder = 'products') => {
  const ext = path.extname(originalName) || '.jpg';
  const filename = `${uuidv4()}${ext}`;
  const key = `${folder}/${filename}`;

  // Check if AWS S3 environment credentials are functional
  if (isS3Configured()) {
    try {
      const s3 = getClient();
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      }));
      const url = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
      return { url, key, filename };
    } catch (err) {
      console.warn('⚠️ S3 upload failed, executing graceful local storage fallback:', err.message);
    }
  }

  // Graceful local disk fallback
  const localPath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(localPath, buffer);

  const port = process.env.PORT || 5000;
  const baseUrl = process.env.SERVER_URL || `http://localhost:${port}`;
  const absoluteUrl = `${baseUrl}/uploads/${filename}`;

  return {
    url: absoluteUrl,
    key: `local/${filename}`,
    filename,
  };
};

/**
 * Delete a file from S3 or local storage
 */
const deleteFile = async (key) => {
  if (isS3Configured() && !key.startsWith('local/')) {
    try {
      const s3 = getClient();
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      return true;
    } catch (err) {
      console.warn('S3 delete failed:', err.message);
    }
  }

  // Local fallback removal
  try {
    const filename = path.basename(key);
    const localPath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  } catch {}

  return true;
};

/**
 * Generate a pre-signed URL for direct S3 uploads/reads
 */
const getPresignedUrl = async (key, expiresIn = 3600) => {
  if (!isS3Configured()) return null;
  try {
    const s3 = getClient();
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    return await getSignedUrl(s3, command, { expiresIn });
  } catch (err) {
    console.warn('S3 presigned URL failed:', err.message);
    return null;
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  getPresignedUrl,
  UPLOAD_DIR,
};
