import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '@fontsource/cairo/400.css'
import '@fontsource/cairo/500.css'
import '@fontsource/cairo/600.css'
import '@fontsource/cairo/700.css'
import './index.css'
import App from './App.jsx'
import { LocalStore } from './store/AppStore.jsx'
import CloudGate from './components/CloudGate.jsx'
import { cloud } from './lib/supabase.js'
import { PdfProvider } from './components/PdfProvider.jsx'

const Store = cloud ? CloudGate : LocalStore

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Store>
        <PdfProvider>
          <App />
        </PdfProvider>
      </Store>
    </HashRouter>
  </StrictMode>,
)
