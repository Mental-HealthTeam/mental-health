import { StrictMode } from 'react'
import './i18n/config'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/base/_global.scss'
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
