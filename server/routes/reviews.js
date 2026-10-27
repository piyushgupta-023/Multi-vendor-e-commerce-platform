const express = require('express');
const router = express.Router();
const { createReview, getProductReviews, markHelpful, vendorReplyToReview, deleteReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middlewares/auth');
const { validateReview, validate } = require('../utils/validators');

router.get('/product/:productId', getProductReviews);
router.post('/', protect, authorize('customer'), validateReview, validate, createReview);
router.post('/:id/helpful', protect, markHelpful);
router.post('/:id/reply', protect, authorize('vendor'), vendorReplyToReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
