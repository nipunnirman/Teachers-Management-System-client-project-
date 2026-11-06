const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

const isConfigured = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let ready = false;
function setup() {
  if (ready || !isConfigured()) return ready;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:noreply@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  ready = true;
  return ready;
}

// Sends saved notifications to each recipient's phones. A push failure must
// never stop the action that created the notification.
async function pushNotifications(notifications) {
  try {
    if (!setup() || notifications.length === 0) return;
    const recipients = notifications.map((n) => n.recipient);
    const subscriptions = await PushSubscription.find({ user: { $in: recipients } });
    if (subscriptions.length === 0) return;

    const sends = [];
    for (const notification of notifications) {
      for (const sub of subscriptions) {
        if (String(sub.user) !== String(notification.recipient)) continue;
        const english = sub.language === 'en';
        const payload = JSON.stringify({
          title: english ? notification.titleEn || notification.title : notification.title,
          body: english ? notification.messageEn || notification.message : notification.message,
          url: '/notifications',
        });
        sends.push(
          webpush
            .sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }, payload)
            .catch(async (error) => {
              // 404 and 410 mean the phone has removed this subscription.
              if (error.statusCode === 404 || error.statusCode === 410) await sub.deleteOne();
              else console.error(`Push failed: ${error.statusCode || error.message}`);
            })
        );
      }
    }
    await Promise.all(sends);
  } catch (error) {
    console.error(`Push failed: ${error.message}`);
  }
}

module.exports = { isConfigured, pushNotifications };
