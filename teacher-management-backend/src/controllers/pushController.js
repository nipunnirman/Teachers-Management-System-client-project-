const PushSubscription = require('../models/PushSubscription');
const { isConfigured } = require('../utils/push');

// @route   GET /api/push/key
// @access  Private
const getKey = (_req, res) => {
  res.status(200).json({ success: true, enabled: isConfigured(), publicKey: process.env.VAPID_PUBLIC_KEY || null });
};

// @route   POST /api/push/subscribe
// @access  Private
const subscribe = async (req, res, next) => {
  try {
    const { subscription, language } = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ success: false, message: 'දැනුම්දීම් සක්‍රීය කිරීමට නොහැකි විය.' });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        user: req.user.id,
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
        language: language === 'en' ? 'en' : 'si',
      },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'දැනුම්දීම් සක්‍රීය විය.' });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/push/unsubscribe
// @access  Private
const unsubscribe = async (req, res, next) => {
  try {
    await PushSubscription.deleteOne({ endpoint: req.body.endpoint, user: req.user.id });
    res.status(200).json({ success: true, message: 'දැනුම්දීම් අක්‍රීය විය.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getKey, subscribe, unsubscribe };
