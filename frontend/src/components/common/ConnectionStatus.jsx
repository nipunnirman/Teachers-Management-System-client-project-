import { useEffect, useState } from 'react';
import { onConnectionStatus } from '../../utils/apiCache';
import { tr } from '../../utils/i18n';

// A small message while the server wakes up or the connection is lost.
export default function ConnectionStatus() {
  const [status, setStatus] = useState({ slow: false, offline: false, waitingForServer: false });

  useEffect(() => onConnectionStatus(setStatus), []);

  let message = null;
  if (status.offline) message = tr('සම්බන්ධතාවක් නැත. සුරැකි තොරතුරු පෙන්වයි.');
  else if (status.slow && status.waitingForServer) message = tr('සේවාදායකය අවදි වෙමින් පවතී. මිනිත්තුවක් පමණ ගත විය හැක.');
  else if (status.slow) message = tr('සුරැකි තොරතුරු පෙන්වයි. යාවත්කාලීන වෙමින්…');

  if (!message) return null;
  return <div className="connection-status" role="status">{message}</div>;
}
