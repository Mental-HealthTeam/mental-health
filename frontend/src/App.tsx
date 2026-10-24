import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { PsychologistProfile } from './pages/PsychologistProfile'
import { SpecialistCabinet } from './pages/SpecialistCabinet/SpecialistCabinet'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/psychologist-profile" element={<PsychologistProfile />} />
                <Route path="/specialist-cabinet" element={<SpecialistCabinet />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
