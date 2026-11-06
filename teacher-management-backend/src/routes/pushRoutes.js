const express = require('express');
const router = express.Router();
const { getKey, subscribe, unsubscribe } = require('../controllers/pushController');
const { protect } = require('../middleware/auth');

router.get('/key', protect, getKey);
router.post('/subscribe', protect, subscribe);
router.post('/unsubscribe', protect, unsubscribe);

module.exports = router;
