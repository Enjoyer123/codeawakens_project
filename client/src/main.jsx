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

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatErrorMessage } from './utils/errorHandler'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Global error handler for all queries
      // Suppress common errors for guest users (public access)
      if (error?.response?.status === 401) return;
      if (error?.message === 'No authentication token available') return;

      console.error('Global Query Error:', error);
      const message = formatErrorMessage(error, 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      toast.error(`เกิดข้อผิดพลาด: ${message}`);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      // Global error handler for all mutations
      // Suppress common errors for guest users
      if (error?.response?.status === 401) return;
      if (error?.message === 'No authentication token available') return;

      console.error('Global Mutation Error:', error);
      const message = formatErrorMessage(error, 'การทำรายการล้มเหลว');
      toast.error(`เกิดข้อผิดพลาด: ${message}`);
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
      retry: 1, // Optional: only retry once
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl={'/'}
        signUpFallbackRedirectUrl={'/auth/callback'}
        signInFallbackRedirectUrl={'/auth/callback'}
      >
        <App />
      </ClerkProvider>
    </QueryClientProvider>
  </StrictMode>,
)

