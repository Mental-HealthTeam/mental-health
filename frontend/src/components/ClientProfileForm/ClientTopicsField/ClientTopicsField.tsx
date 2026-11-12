import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { SymptomCode } from '../../../types/psychologist.ts'
import { useGetSymptomCodesQuery } from '../../../services/psychologistsApi.ts'
import { PrimaryButton, TagButton } from '../../UI/Buttons'
import { CloseAiChatIcon } from '../../UI/Icons/CloseAiChatIcon.tsx'
import './ClientTopicsField.scss'
type Props = {
    selectedTopics: SymptomCode[]
    onChange: (topics: SymptomCode[]) => void
}

export const ClientTopicsField = ({ selectedTopics, onChange }: Props) => {
    const { t } = useTranslation('clientProfileSettings')
    const { t: tSymptoms } = useTranslation('symptoms')
    const titleId = useId()

    const {
        data: topicCodes = [],
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useGetSymptomCodesQuery()

    const availableTopics = [...new Set(topicCodes)].filter(
        (code) => !selectedTopics.includes(code),
    )

    return (
        <section
            className="client-profile-form__panel"
            aria-labelledby={titleId}
            aria-busy={isFetching}
        >
            <h2 className="client-profile-form__title" id={titleId}>
                {t('topicsTitle')}
            </h2>

            {selectedTopics.length > 0 && (
                <div className="client-profile-form__topic-group">
                    <h3 className="client-profile-form__hint">{t('myTopics')}</h3>

                    <ul className="client-profile-form__topics">
                        {selectedTopics.map((code) => {
                            const label = tSymptoms(`${code}.title` as const)

                            return (
                                <li key={code}>
                                    <TagButton
                                        variant="green"
                                        isSelected
                                        aria-label={t('removeTopic', {
                                            topic: label,
                                        })}
                                        onClick={() =>
                                            onChange(
                                                selectedTopics.filter((topic) => topic !== code),
                                            )
                                        }
                                        endIcon={<CloseAiChatIcon />}
                                    >
                                        {label}
                                    </TagButton>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}

            {(isLoading || isError || availableTopics.length > 0) && (
                <div className="client-profile-form__topic-group">
                    <h3 className="client-profile-form__hint">{t('topicsHint')}</h3>

                    {isLoading && (
                        <p className="client-profile-form__hint" role="status">
                            {t('topicsLoading')}
                        </p>
                    )}

                    {isError && (
                        <div className="client-profile-form__topics-error" role="alert">
                            <p className="client-profile-form__error">{t('topicsLoadError')}</p>

                            <PrimaryButton
                                type="button"
                                disabled={isFetching}
                                onClick={() => void refetch()}
                            >
                                {t('retry')}
                            </PrimaryButton>
                        </div>
                    )}

                    <ul className="client-profile-form__topics">
                        {availableTopics.map((code) => (
                            <li key={code}>
                                <TagButton
                                    variant="green"
                                    onClick={() => onChange([...selectedTopics, code])}
                                >
                                    {tSymptoms(`${code}.title` as const)}
                                </TagButton>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    )
}
