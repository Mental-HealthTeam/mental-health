import './TopicsPicker.scss'
import type { SymptomCode } from '../../../../types/psychologist'
import { CloseAiChatIcon } from '../../../../components/UI/Icons/CloseAiChatIcon'
import { useGetSymptomCodesQuery } from '../../../../services/psychologistsApi'
import { useTranslation } from 'react-i18next'

type Props = {
    value: SymptomCode[]
    onChange: (value: SymptomCode[]) => void
}

export const TopicsPicker = ({ value, onChange }: Props) => {
    const { t } = useTranslation('symptoms')
    const { data: options = [], isLoading, isError, refetch } = useGetSymptomCodesQuery()

    if (isLoading) return <p>Завантаження напрямків...</p>

    if (isError) {
        return (
            <div>
                <p>Не вдалося завантажити напрямки.</p>
                <button type="button" onClick={refetch}>
                    Спробувати ще раз
                </button>
            </div>
        )
    }

    const selected = options.filter((o) => value.includes(o))
    const available = options.filter((o) => !value.includes(o))

    const handleAdd = (code: SymptomCode) => {
        onChange([...value, code])
    }

    const handleRemove = (code: SymptomCode) => {
        onChange(value.filter((c) => c !== code))
    }

    return (
        <div className="topics-picker">
            {selected.length > 0 && (
                <div className="topics-picker__group">
                    <p className="topics-picker__title">Твої напрямки роботи:</p>

                    <ul className="topics-picker__list">
                        {selected.map((code) => (
                            <li key={code}>
                                <button
                                    type="button"
                                    className="topics-picker__tag topics-picker__tag--selected"
                                    onClick={() => handleRemove(code)}
                                    aria-label={t(`${code}.title`)}
                                >
                                    {t(`${code}.title`)}
                                    <span className="topics-picker__remove" aria-hidden="true">
                                        <CloseAiChatIcon />
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="topics-picker__group">
                <p className="topics-picker__title">Додати інші напрямки роботи:</p>

                <ul className="topics-picker__list">
                    {available.map((code) => (
                        <li key={code}>
                            <button
                                type="button"
                                className="topics-picker__tag"
                                onClick={() => handleAdd(code)}
                            >
                                {t(`${code}.title`)}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
