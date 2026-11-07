import { useEffect, useState } from 'react';
import { notifAPI } from '../../api';
import { useDataRefresh } from '../../utils/useDataRefresh';

const EVENT = 'notifications:unread';

// The Notifications page calls this after every load so the badges stay in step.
export function publishUnreadCount(count) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: count }));
}

export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const { version } = useDataRefresh();

  useEffect(() => {
    let active = true;
    notifAPI.getAll({ unreadOnly: 'true' })
      .then(({ data }) => { if (active) setCount(data.unreadCount || 0); })
      .catch(() => {});

    const onChange = (e) => setCount(e.detail || 0);
    window.addEventListener(EVENT, onChange);
    return () => {
      active = false;
      window.removeEventListener(EVENT, onChange);
    };
  }, [version]);

  return count;
}
