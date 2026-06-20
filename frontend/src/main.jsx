import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#15161c',
              color: '#f0ede6',
              border: '1px solid #2a2b36',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13.5px',
            },
            success: { iconTheme: { primary: '#4caf7d', secondary: '#15161c' } },
            error:   { iconTheme: { primary: '#e05c5c', secondary: '#15161c' } },
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
