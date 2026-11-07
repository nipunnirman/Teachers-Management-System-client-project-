import { useEffect, useRef, useState } from 'react';
import { onDataChanged } from './apiCache';

// Reloads a page's data when newer data arrives in the background. `isRefresh()`
// lets a page skip its spinner, and any open form, for these quiet updates.
export function useDataRefresh() {
  const [version, setVersion] = useState(0);
  const loadedVersion = useRef(0);

  useEffect(() => onDataChanged(() => setVersion((v) => v + 1)), []);

  const isRefresh = () => {
    const refresh = loadedVersion.current !== version;
    loadedVersion.current = version;
    return refresh;
  };

  return { version, isRefresh };
}
