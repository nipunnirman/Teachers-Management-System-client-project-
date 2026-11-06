import { pushAPI } from '../api';
import { getLanguage } from './i18n';

export const isPushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

function keyToBytes(base64) {
  const normalized = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(normalized), (c) => c.charCodeAt(0));
}

async function getRegistration() {
  return (await navigator.serviceWorker.getRegistration()) || navigator.serviceWorker.register('/sw.js');
}

export async function getSubscription() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

// Returns 'on', 'denied' or 'unavailable'.
export async function enablePush() {
  if (!isPushSupported()) return 'unavailable';
  const { data } = await pushAPI.key();
  if (!data.enabled || !data.publicKey) return 'unavailable';
  if ((await Notification.requestPermission()) !== 'granted') return 'denied';

  const registration = await getRegistration();
  const subscription = (await registration.pushManager.getSubscription())
    || (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(data.publicKey) }));
  await pushAPI.subscribe({ subscription: subscription.toJSON(), language: getLanguage() });
  return 'on';
}

export async function disablePush() {
  const subscription = await getSubscription();
  if (!subscription) return;
  await pushAPI.unsubscribe({ endpoint: subscription.endpoint }).catch(() => {});
  await subscription.unsubscribe();
}

export function forgetPushOnDevice() {
  getSubscription().then((subscription) => subscription?.unsubscribe()).catch(() => {});
}

let languageSynced = false;

// Phones get notifications in the language last chosen in the app.
export async function syncPushLanguage() {
  if (languageSynced) return;
  languageSynced = true;
  try {
    const subscription = await getSubscription();
    if (subscription) await pushAPI.subscribe({ subscription: subscription.toJSON(), language: getLanguage() });
  } catch {
    // Not critical; it will try again next time the app opens.
  }
}
