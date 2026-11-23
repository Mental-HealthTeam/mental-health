import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { SlotGroup } from '../bookingSlots.types.ts'
import { TimeSlot } from '../../../UI/TimeSlot'
import './BookingSlotsList.scss'

type Props = {
    groups: SlotGroup[]
    selectedSlot: string
    disabled: boolean
    dateFormatter: Intl.DateTimeFormat
    timeFormatter: Intl.DateTimeFormat
    onSelect: (time: string) => void
}

export const BookingSlotsList = ({
    groups,
    selectedSlot,
    disabled,
    dateFormatter,
    timeFormatter,
    onSelect,
}: Props) => {
    const { t } = useTranslation('specialistProfile')
    const id = useId()

    return (
        <div
            className="booking-slots-modal__slots"
            role="region"
            aria-label={t('bookingModal.availableTimes')}
            tabIndex={0}
        >
            <div role="radiogroup" aria-label={t('bookingModal.availableTimes')}>
                {groups.map((group) => (
                    <section
                        className="booking-slots-modal__day"
                        key={group.key}
                        aria-labelledby={`${id}-${group.key}`}
                    >
                        <h3 id={`${id}-${group.key}`}>{dateFormatter.format(group.date)}</h3>

                        <div className="booking-slots-modal__grid">
                            {group.times.map((time) => (
                                <TimeSlot
                                    key={time}
                                    label={timeFormatter.format(new Date(time))}
                                    value={time}
                                    name={`booking-${id}`}
                                    checked={Date.parse(selectedSlot) === Date.parse(time)}
                                    disabled={disabled}
                                    onChange={onSelect}
                                />
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {groups.length === 0 && (
                <p className="booking-slots-modal__empty" role="status">
                    {t('bookingModal.empty')}
                </p>
            )}
        </div>
    )
}
