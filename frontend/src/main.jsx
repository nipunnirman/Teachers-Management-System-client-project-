import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { getLanguage } from './utils/i18n'
import { APP_NAME } from './utils/locale'
import App from './App'
import ConnectionStatus from './components/common/ConnectionStatus'
import './index.css'

document.documentElement.lang = getLanguage()
document.title = APP_NAME

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <ConnectionStatus />
        <Toaster
          position="top-center"
          containerStyle={{ top: 'calc(12px + env(safe-area-inset-top, 0px))' }}
          toastOptions={{
            style: {
              background: '#18203a',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '10px 14px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 500,
            },
            success: { iconTheme: { primary: '#5fd0a1', secondary: '#18203a' } },
            error:   { iconTheme: { primary: '#f08a86', secondary: '#18203a' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered:', reg.scope))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}
