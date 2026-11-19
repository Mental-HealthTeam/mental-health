import { Outlet } from 'react-router-dom'

import { PageTransition } from '../components/UI/PageTransition'
import { BookingModalProvider } from '../providers/BookingModalProvider'

export const RootLayout = () => (
    <BookingModalProvider>
        <PageTransition>
            <Outlet />
        </PageTransition>
    </BookingModalProvider>
)
