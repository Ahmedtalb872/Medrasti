import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '@fontsource/ibm-plex-sans-arabic/400.css'
import '@fontsource/ibm-plex-sans-arabic/500.css'
import '@fontsource/ibm-plex-sans-arabic/600.css'
import '@fontsource/ibm-plex-sans-arabic/700.css'
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
