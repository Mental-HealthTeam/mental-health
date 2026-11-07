import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { Home } from './pages/Home'
import { PsychologistProfile } from './pages/PsychologistProfile'
import { SpecialistCabinet } from './pages/SpecialistCabinet/SpecialistCabinet'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { NotFoundPage } from './pages/NotFoundPage'
import { SlotUnavailablePage } from './pages/SlotUnavailablePage'
import { SuccessPage } from './pages/SuccessPage'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/specialist-cabinet" element={<SpecialistCabinet />} />
                <Route path="/psychologist-profile/:id" element={<PsychologistProfile />} />
                <Route path="*" element={<NotFoundPage />} />
                <Route path="/slot-unavailable" element={<SlotUnavailablePage />} />
                <Route path="/payment/success" element={<SuccessPage />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/sign-up" element={<SignUp />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
