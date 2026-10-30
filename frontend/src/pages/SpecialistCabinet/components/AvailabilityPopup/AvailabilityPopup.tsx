import { useState } from 'react'
import './AvailabilityPopup.scss'
import { Button } from '../../../../components/UI/Button'
import { CloseAiChatIcon } from '../../../../components/UI/Icons/CloseAiChatIcon'
import { PrimaryButton } from '../../../../components/UI/Buttons'

type Props = {
    onCloseAvailabilityPopup: () => void
}

export const AvailabilityPopup = ({ onCloseAvailabilityPopup }: Props) => {
    const [date, setDate] = useState('2026-12-02')
    const [time, setTime] = useState('14:00')

    const handleAddSession = () => {}

    return (
        <section className="availability-popup" aria-labelledby="availability-title">
            <div className="availability-popup__header">
                <h3 className="availability-popup__title" id="availability-title">
                    Додай вільний час для наступних сесій
                </h3>

                <Button
                    className="availability-popup__close"
                    variant="secondary"
                    size="small"
                    ariaLabel="Закрити вікно"
                    startIcon={<CloseAiChatIcon />}
                    onClick={onCloseAvailabilityPopup}
                />
            </div>

            <form className="availability-popup__form" onSubmit={handleAddSession}>
                <div className="availability-popup__field">
                    <label htmlFor="availability-date" className="availability-popup__label">
                        Дата
                    </label>

                    <input
                        className="availability-popup__input"
                        type="date"
                        id="availability-date"
                        name="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>

                <div className="availability-popup__field">
                    <label htmlFor="availability-time" className="availability-popup__label">
                        Час
                    </label>

                    <input
                        className="availability-popup__input"
                        type="time"
                        id="availability-time"
                        name="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                    />
                </div>

                <PrimaryButton className="availability-popup__submit" onClick={handleAddSession}>
                    Додати
                </PrimaryButton>
            </form>
        </section>
    )
}
