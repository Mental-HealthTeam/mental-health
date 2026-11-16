import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Booking } from '../../../types/booking'

import { Avatar } from '../../UI/Avatar'
import { OutlineButton, PrimaryButton } from '../../UI/Buttons'
import { ArrowIcon, AvatarFallbackIcon } from '../../UI/Icons'
import { Modal } from '../../UI/Modal'

import './ResumeBookingModal.scss'

type Props = {
    booking: Booking
    onClose: () => void
    onContinue: () => void
    isLoading?: boolean
    error?: string | null
}

export const ResumeBookingModal = ({
    booking,
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

    const formattedDate = new Intl.DateTimeFormat(language, {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone,
    }).format(new Date(booking.selected_time))

    const formattedPrice = new Intl.NumberFormat(language, {
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

                <div className="resume-booking-modal__specialist">
                    <Avatar
                        src={booking.psychologist.avatar_url ?? undefined}
                        alt=""
                        size="medium"
                        fallback={<AvatarFallbackIcon />}
                    />

                    <h3>{booking.psychologist.full_name}</h3>
                </div>

                <dl className="resume-booking-modal__details">
                    <div>
                        <dt>{t('resumeBooking.date')}</dt>

                        <dd>
                            <time dateTime={booking.selected_time}>{formattedDate}</time>
                        </dd>
                    </div>

                    <div>
                        <dt>{t('resumeBooking.price')}</dt>
                        <dd>{formattedPrice}</dd>
                    </div>
                </dl>

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
                        disabled={actionsDisabled}
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
        </Modal>
    )
}
