import { StrictMode } from 'react'
import './i18n/config'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/base/_global.scss'
import { Provider } from 'react-redux'
import { store } from './app/store/store.ts'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </StrictMode>,
)
