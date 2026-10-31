import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { PsychologistProfile } from './pages/PsychologistProfile'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/psychologist-profile/:id" element={<PsychologistProfile />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
