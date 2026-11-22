import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Booking } from '../../../types/booking'

import { Avatar } from '../../UI/Avatar'
import { OutlineButton, PrimaryButton } from '../../UI/Buttons'
import { ArrowIcon } from '../../UI/Icons'
import { Modal } from '../../UI/Modal'
import { RadioButton } from '../../UI/RadioButton'

import './ResumeBookingModal.scss'

type Props = {
    bookings: Booking[]
    selectedBookingId: string | null
    onSelectBooking: (bookingId: string) => void
    onClose: () => void
    onContinue: () => void
    isLoading?: boolean
    error?: string | null
}

export const ResumeBookingModal = ({
    bookings,
    selectedBookingId,
    onSelectBooking,
    onClose,
    onContinue,
    isLoading = false,
    error = null,
}: Props) => {
    const { t, i18n } = useTranslation('specialistProfile')
    const [isOpen, setIsOpen] = useState(true)

    const language = i18n.resolvedLanguage ?? i18n.language ?? 'uk'
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const actionsDisabled = isLoading || !isOpen

    const selectedBooking =
        bookings.find((booking) => booking.booking_id === selectedBookingId) ?? null

    const formatDate = (date: string) =>
        new Intl.DateTimeFormat(language, {
            dateStyle: 'long',
            timeStyle: 'short',
            timeZone,
        }).format(new Date(date))

    const formatPrice = (booking: Booking) =>
        new Intl.NumberFormat(language, {
            style: 'currency',
            currency: booking.currency,
        }).format(Number(booking.price))

    const handleClose = () => {
        if (!isLoading) {
            setIsOpen(false)
        }
    }

    return (
        <Modal
            open={isOpen}
            className="resume-booking-modal"
            title={t('resumeBooking.title')}
            closeLabel={t('resumeBooking.close')}
            closeDisabled={actionsDisabled}
            onClose={handleClose}
            onExited={onClose}
        >
            <div className="resume-booking-modal__content" aria-busy={isLoading}>
                <p className="resume-booking-modal__description">
                    {t('resumeBooking.description')}
                </p>

                <div
                    className="resume-booking-modal__bookings"
                    role="radiogroup"
                    aria-label={t('resumeBooking.title')}
                >
                    {bookings.map((booking) => {
                        const isSelected = selectedBookingId === booking.booking_id

                        return (
                            <label
                                key={booking.booking_id}
                                className={`resume-booking-modal__booking ${
                                    isSelected ? 'resume-booking-modal__booking--selected' : ''
                                }`}
                            >
                                <div className="resume-booking-modal__specialist">
                                    <Avatar
                                        src={booking.psychologist.avatar_url ?? undefined}
                                        alt=""
                                        size="medium"
                                    />

                                    <h3 className="resume-booking-modal__specialist-name">
                                        {booking.psychologist.full_name}
                                    </h3>

                                    <RadioButton
                                        name="pending-booking"
                                        value={booking.booking_id}
                                        checked={isSelected}
                                        disabled={actionsDisabled}
                                        ariaLabel={`${booking.psychologist.full_name}, ${formatDate(booking.selected_time)}`}
                                        onChange={onSelectBooking}
                                    />
                                </div>

                                <dl className="resume-booking-modal__details">
                                    <div>
                                        <dt>{t('resumeBooking.date')}</dt>

                                        <dd>
                                            <time dateTime={booking.selected_time}>
                                                {formatDate(booking.selected_time)}
                                            </time>
                                        </dd>
                                    </div>

                                    <div>
                                        <dt>{t('resumeBooking.price')}</dt>
                                        <dd>{formatPrice(booking)}</dd>
                                    </div>
                                </dl>
                            </label>
                        )
                    })}
                </div>

                <div className="resume-booking-modal__footer">
                    <p className="resume-booking-modal__timezone">
                        {t('resumeBooking.timeZone', { timeZone })}
                    </p>

                    {error && (
                        <p className="resume-booking-modal__error" role="alert">
                            {error}
                        </p>
                    )}

                    <div className="resume-booking-modal__actions">
                        <PrimaryButton
                            fullWidth
                            disabled={actionsDisabled || !selectedBooking}
                            endIcon={<ArrowIcon />}
                            onClick={onContinue}
                        >
                            {t('resumeBooking.continue')}
                        </PrimaryButton>

                        <OutlineButton disabled={actionsDisabled} onClick={handleClose}>
                            {t('resumeBooking.later')}
                        </OutlineButton>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
