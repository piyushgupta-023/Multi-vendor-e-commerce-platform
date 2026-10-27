const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { protect } = require('../middlewares/authMiddleware');
const { uploadFile, deleteFile } = require('../services/s3Service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @route   POST /api/upload
 * @desc    Upload single or multiple image files (S3 or local fallback)
 * @access  Protected
 */
router.post('/', protect, upload.array('images', 10), async (req, res) => {
  try {
    // Handle both single file (upload.single) or multiple (upload.array)
    const files = req.files || (req.file ? [req.file] : []);

    if (files.length === 0) {
      return sendError(res, 400, 'No image files provided for upload.');
    }

    const folder = req.body.folder || 'products';
    const uploadPromises = files.map(file =>
      uploadFile(file.buffer, file.originalname, file.mimetype, folder)
    );

    const results = await Promise.all(uploadPromises);
    const urls = results.map(r => r.url);

    return sendSuccess(res, 200, 'Images uploaded successfully', {
      urls,
      files: results,
      count: results.length,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return sendError(res, 500, err.message || 'Image upload failed');
  }
});

/**
 * @route   DELETE /api/upload
 * @desc    Delete an uploaded file by key or filename
 * @access  Protected
 */
router.delete('/', protect, async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return sendError(res, 400, 'File key required');
    await deleteFile(key);
    return sendSuccess(res, 200, 'File deleted successfully');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
});

module.exports = router;
