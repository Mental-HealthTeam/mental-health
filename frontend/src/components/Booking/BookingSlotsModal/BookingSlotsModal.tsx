import { useTranslation } from 'react-i18next'

import { Modal } from '../../UI/Modal'

import { useBookingSlots } from './useBookingSlots'
import { useBookingSubmit } from './useBookingSubmit'
import type { BookingSlotsModalProps } from './bookingSlots.types'

import { BookingSpecialist } from './BookingSpecialist/BookingSpecialist'
import { BookingSlotsList } from './BookingSlotsList/BookingSlotsList'
import { BookingSlotsFooter } from './BookingSlotsFooter/BookingSlotsFooter'

import './BookingSlotsModal.scss'

export const BookingSlotsModal = ({
    open,
    specialist,
    slots,
    initialSelectedTime = '',
    onClose,
    onCheckoutReady,
    timeZone,
    aiSessionId,
}: BookingSlotsModalProps) => {
    const { t, i18n } = useTranslation('specialistProfile')

    const language = i18n.resolvedLanguage ?? i18n.language ?? 'uk'
    const displayedTimeZone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone

    const { availableSlots, groups, dateFormatter, timeFormatter, selectedDateFormatter } =
        useBookingSlots({
            open,
            slots,
            language,
            timeZone: displayedTimeZone,
        })

    const {
        selectedSlot,
        matchingBookingId,
        isSubmitting,
        hasRequestError,
        handleSelectSlot,
        handleClose,
        submit,
    } = useBookingSubmit({
        psychologistId: specialist.psychologist_id,
        initialSelectedTime,
        aiSessionId,
        onClose,
        onCheckoutReady,
    })

    const selected = availableSlots.find(({ date }) => date.getTime() === Date.parse(selectedSlot))

    const selectedDate = selected?.date ?? (matchingBookingId ? new Date(selectedSlot) : null)

    return (
        <Modal
            open={open}
            className="booking-slots-modal"
            title={t('bookingModal.title')}
            closeLabel={t('bookingModal.close')}
            closeDisabled={isSubmitting}
            onClose={handleClose}
        >
            <div className="booking-slots-modal__layout" aria-busy={isSubmitting}>
                <header className="booking-slots-modal__header">
                    <p className="booking-slots-modal__description">
                        {t('bookingModal.description')}
                    </p>

                    <BookingSpecialist specialist={specialist} language={language} />
                </header>

                <BookingSlotsList
                    groups={groups}
                    selectedSlot={selectedSlot}
                    disabled={isSubmitting}
                    dateFormatter={dateFormatter}
                    timeFormatter={timeFormatter}
                    onSelect={handleSelectSlot}
                />

                <BookingSlotsFooter
                    timeZone={displayedTimeZone}
                    selectedDate={selectedDate}
                    selectedDateFormatter={selectedDateFormatter}
                    hasRequestError={hasRequestError}
                    disabled={(!selected && !matchingBookingId) || isSubmitting}
                    onContinue={() => {
                        void submit(selected?.time)
                    }}
                />
            </div>
        </Modal>
    )
}
