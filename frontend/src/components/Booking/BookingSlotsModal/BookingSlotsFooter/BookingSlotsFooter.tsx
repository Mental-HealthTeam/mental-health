import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '../../../UI/Buttons'
import { ArrowIcon } from '../../../UI/Icons'
import './BookingSlotsFooter.scss'

type Props = {
    timeZone: string
    selectedDate: Date | null
    selectedDateFormatter: Intl.DateTimeFormat
    hasRequestError: boolean
    disabled: boolean
    onContinue: () => void
}

export const BookingSlotsFooter = ({
    timeZone,
    selectedDate,
    selectedDateFormatter,
    hasRequestError,
    disabled,
    onContinue,
}: Props) => {
    const { t } = useTranslation('specialistProfile')

    return (
        <footer className="booking-slots-modal__footer">
            <p className="booking-slots-modal__timezone">
                {t('bookingModal.timeZone', { timeZone })}
            </p>

            <p className="booking-slots-modal__selection" role="status" aria-live="polite">
                {selectedDate
                    ? t('bookingModal.selected', {
                          date: selectedDateFormatter.format(selectedDate),
                      })
                    : t('bookingModal.selectTime')}
            </p>

            {hasRequestError && <p role="alert">{t('bookingModal.requestError')}</p>}

            <PrimaryButton
                className="booking-slots-modal__continue"
                fullWidth
                disabled={disabled}
                endIcon={<ArrowIcon />}
                onClick={onContinue}
            >
                {t('bookingModal.continue')}
            </PrimaryButton>
        </footer>
    )
}
