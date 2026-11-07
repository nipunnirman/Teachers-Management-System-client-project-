// Shows saved data straight away and updates it in the background, so a sleeping
// server does not leave people staring at a spinner.
const PREFIX = 'tms-api:';
const CHANGED_KEY = 'tms-api-changed';
const MAX_AGE = 14 * 24 * 60 * 60 * 1000;
const REFRESH_GAP = 5000;
const SLOW_AFTER = 4000;

// QR codes, sign-in and phone subscriptions are never saved.
const SAVEABLE = /^\/(teachers|attendance|leaves|timetable|notifications|reports|settings|calendar|relief)(\/|$)/;
const NEVER_SAVE = /^\/attendance\/qr/;
const QUIET = /^\/auth\/me$/;

const isSaveable = (config) =>
  (config.method || 'get').toLowerCase() === 'get' && SAVEABLE.test(config.url) && !NEVER_SAVE.test(config.url);

function currentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.id || user?._id || null;
  } catch {
    return null;
  }
}

function keyFor(config) {
  const userId = currentUserId();
  if (!userId) return null;
  const params = Object.entries(config.params || {})
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `${PREFIX}${userId}:${config.url}?${JSON.stringify(params)}`;
}

function readEntry(key) {
  try {
    const entry = JSON.parse(localStorage.getItem(key));
    if (!entry || Date.now() - entry.at > MAX_AGE) return null;
    return entry;
  } catch {
    return null;
  }
}

function savedKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) keys.push(key);
  }
  return keys;
}

function writeEntry(key, body) {
  const value = JSON.stringify({ at: Date.now(), body });
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage is full: make room by dropping the older half, then try once more.
    try {
      const oldestFirst = savedKeys().sort((a, b) => (readEntry(a)?.at || 0) - (readEntry(b)?.at || 0));
      oldestFirst.slice(0, Math.ceil(oldestFirst.length / 2)).forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(key, value);
    } catch {
      // The app still works without saved data.
    }
  }
}

// After someone changes something, saved answers are only a fallback until replaced.
const changedAt = () => Number(localStorage.getItem(CHANGED_KEY)) || 0;

export function markDataChanged() {
  try {
    localStorage.setItem(CHANGED_KEY, String(Date.now()));
  } catch {
    // Nothing else to do.
  }
}

export function clearApiCache() {
  try {
    savedKeys().forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem(CHANGED_KEY);
  } catch {
    // Nothing else to do.
  }
}

// ── Updates for pages already on screen ──────────────
const dataListeners = new Set();
let notifyTimer;

export function onDataChanged(listener) {
  dataListeners.add(listener);
  return () => dataListeners.delete(listener);
}

function notifyDataChanged() {
  clearTimeout(notifyTimer);
  notifyTimer = setTimeout(() => dataListeners.forEach((listener) => listener()), 300);
}

// ── Connection status for the small message on screen ─
let waiting = 0;
let refreshing = 0;
let slowTimer;
let status = { slow: false, offline: false, waitingForServer: false };
const statusListeners = new Set();

function setStatus(change) {
  status = { ...status, ...change };
  statusListeners.forEach((listener) => listener(status));
}

export function onConnectionStatus(listener) {
  statusListeners.add(listener);
  listener(status);
  return () => statusListeners.delete(listener);
}

function track(promise, background) {
  if (background) refreshing += 1;
  else waiting += 1;
  if (!slowTimer) {
    slowTimer = setTimeout(() => setStatus({ slow: true, waitingForServer: waiting > 0 }), SLOW_AFTER);
  } else if (status.slow) {
    setStatus({ waitingForServer: waiting > 0 });
  }

  const finished = () => {
    if (background) refreshing -= 1;
    else waiting -= 1;
    if (waiting + refreshing === 0) {
      clearTimeout(slowTimer);
      slowTimer = null;
      setStatus({ slow: false, waitingForServer: false });
    } else if (status.slow) {
      setStatus({ waitingForServer: waiting > 0 });
    }
  };

  promise.then(
    () => {
      setStatus({ offline: false });
      finished();
    },
    (error) => {
      // No response at all means the network or server could not be reached.
      if (!error?.response) setStatus({ offline: true });
      else setStatus({ offline: false });
      finished();
    },
  );
  return promise;
}

// ── The request layer ────────────────────────────────
const lastRefresh = new Map();

function refreshInBackground(key, config, entry, network, onUnauthorized) {
  if (Date.now() - (lastRefresh.get(key) || 0) < REFRESH_GAP) return;
  lastRefresh.set(key, Date.now());
  track(network(config), true).then(
    (response) => {
      writeEntry(key, response.data);
      if (response.data !== entry.body) notifyDataChanged();
    },
    (error) => {
      if (error?.response?.status === 401) onUnauthorized();
    },
  );
}

export function cachedAdapter(network, onUnauthorized) {
  return async (config) => {
    if (!isSaveable(config)) return track(network(config), QUIET.test(config.url));

    const key = keyFor(config);
    if (!key) return track(network(config), false);

    const entry = readEntry(key);
    const savedResponse = () => ({
      data: entry.body,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: null,
    });

    // Fresh enough to show now, and update quietly behind the scenes.
    if (entry && config.cacheMode !== 'network' && entry.at >= changedAt()) {
      refreshInBackground(key, config, entry, network, onUnauthorized);
      return savedResponse();
    }

    try {
      const response = await track(network(config), false);
      writeEntry(key, response.data);
      return response;
    } catch (error) {
      // With no connection, saved data is better than an error.
      if (!error?.response && entry) return savedResponse();
      throw error;
    }
  };
}
