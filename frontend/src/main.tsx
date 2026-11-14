import { StrictMode } from 'react'
import './i18n/config'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/base/_global.scss'
import { Provider } from 'react-redux'
import { store } from './app/store/store.ts'
import { GoogleOAuthProvider } from '@react-oauth/google'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <Provider store={store}>
                <App />
            </Provider>
        </GoogleOAuthProvider>
    </StrictMode>,
)
