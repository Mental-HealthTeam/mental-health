import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'

import { ModalLoadingFallback } from '../../components/UI/ModalLoadingFallback'
import type { BookingSlotsModalProps } from '../../components/Booking/BookingSlotsModal/bookingSlots.types'

let bookingSlotsPromise: Promise<ComponentType<BookingSlotsModalProps>> | undefined

const loadBookingSlotsModal = () => {
    bookingSlotsPromise ??= import('../../components/Booking/BookingSlotsModal')
        .then((module) => module.BookingSlotsModal)
        .catch((error: unknown) => {
            bookingSlotsPromise = undefined
            throw error
        })

    return bookingSlotsPromise
}

export const BookingSlotsFlow = (props: BookingSlotsModalProps) => {
    const { t } = useTranslation('specialistProfile')

    const [Component, setComponent] = useState<ComponentType<BookingSlotsModalProps> | null>(null)

    const [isLoaderHidden, setIsLoaderHidden] = useState(false)
    const [loadError, setLoadError] = useState<unknown>(null)

    useEffect(() => {
        let cancelled = false

        void loadBookingSlotsModal().then(
            (LoadedComponent) => {
                if (!cancelled) {
                    setComponent(() => LoadedComponent)
                }
            },
            (error: unknown) => {
                if (!cancelled) {
                    setLoadError(error)
                }
            },
        )

        return () => {
            cancelled = true
        }
    }, [])

    if (loadError) {
        throw loadError
    }

    if (!isLoaderHidden || !Component) {
        return (
            <ModalLoadingFallback
                open={!Component}
                loadingLabel={t('bookingModal.loading')}
                closeLabel={t('bookingModal.close')}
                onClose={props.onClose}
                onExited={() => {
                    setIsLoaderHidden(true)
                }}
            />
        )
    }

    return <Component {...props} />
}
