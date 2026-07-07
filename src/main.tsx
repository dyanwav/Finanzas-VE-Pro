import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TooltipProvider>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'hsl(222 12% 7%)',
              border: '1px solid hsl(217 12% 17%)',
              color: 'hsl(210 20% 95%)',
            },
          }}
        />
      </TooltipProvider>
    </BrowserRouter>
  </StrictMode>
)
