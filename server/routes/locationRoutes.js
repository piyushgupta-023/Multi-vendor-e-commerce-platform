const express = require('express');
const { lookupPincode } = require('../controllers/locationController');

const router = express.Router();

router.get('/pincode/:pincode', lookupPincode);

module.exports = router;
