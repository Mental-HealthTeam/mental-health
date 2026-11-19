import { createBrowserRouter, Outlet } from 'react-router-dom'

import { BookingModalProvider } from '../providers/BookingModalProvider'
import { Home } from '../pages/Home'
import { PsychologistProfile } from '../pages/PsychologistProfile'
import { SpecialistCabinet } from '../pages/SpecialistCabinet/SpecialistCabinet'
import { SignIn } from '../pages/SignIn'
import { SignUp } from '../pages/SignUp'
import { CatalogPage } from '../pages/CatalogPage'
import { ClientProfileSettingsPage } from '../pages/ClientProfileSettingsPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { SlotUnavailablePage } from '../pages/SlotUnavailablePage'
import { SuccessPage } from '../pages/SuccessPage'
import { SpecialistProfileSettingsPage } from '../pages/SpecialistProfileSettingsPage'
import { ClientCabinetPage } from '../pages/ClientCabinetPage'

const RootLayout = () => (
    <BookingModalProvider>
        <Outlet />
    </BookingModalProvider>
)

export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        children: [
            { path: '/', element: <Home /> },
            { path: '/specialist/cabinet', element: <SpecialistCabinet /> },
            {
                path: '/specialist/settings/profile',
                element: <SpecialistProfileSettingsPage />,
            },
            { path: '/psychologist-profile/:id', element: <PsychologistProfile /> },
            { path: '/cabinet/settings', element: <ClientProfileSettingsPage /> },
            { path: '/catalog', element: <CatalogPage /> },
            { path: '/slot-unavailable', element: <SlotUnavailablePage /> },
            { path: '/payment/success', element: <SuccessPage /> },
            { path: '/cabinet', element: <ClientCabinetPage /> },
            { path: '/sign-in', element: <SignIn /> },
            { path: '/sign-up', element: <SignUp /> },
            { path: '*', element: <NotFoundPage /> },
        ],
    },
])
