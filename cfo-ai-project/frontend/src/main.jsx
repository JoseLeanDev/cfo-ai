import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#17181B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '2px',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.875rem',
              padding: '12px 16px',
              boxShadow: '0 12px 32px -8px rgba(23, 24, 27, 0.18)',
            },
            success: { iconTheme: { primary: '#2F8F5F', secondary: '#FFFFFF' } },
            error: { iconTheme: { primary: '#C2452F', secondary: '#FFFFFF' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
