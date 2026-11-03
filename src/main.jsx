import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '@fontsource/cairo/400.css'
import '@fontsource/cairo/500.css'
import '@fontsource/cairo/600.css'
import '@fontsource/cairo/700.css'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './store/AppStore.jsx'
import { PdfProvider } from './components/PdfProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <AppProvider>
        <PdfProvider>
          <App />
        </PdfProvider>
      </AppProvider>
    </HashRouter>
  </StrictMode>,
)
