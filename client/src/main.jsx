import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY


if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

// // Disable console.log to reduce noise
// console.log = () => {};

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY} 
        afterSignOutUrl={'/'} 
        signUpFallbackRedirectUrl={'/auth/callback'} 
        signInFallbackRedirectUrl={'/auth/callback'}
      >
        <App />
      </ClerkProvider>
    </StrictMode>,
)

