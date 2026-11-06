import { createPortal } from 'react-dom';

// Hidden on screen. When printing, this replaces the whole app.
export default function PrintArea({ children }) {
  return createPortal(<div className="print-area">{children}</div>, document.body);
}
