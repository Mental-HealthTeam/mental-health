import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'

import type { SymptomCode } from '../../../types/psychologist.ts'
import { useGetSymptomCodesQuery } from '../../../services/psychologistsApi.ts'

import { PrimaryButton, TagButton } from '../../UI/Buttons'
import { CloseAiChatIcon } from '../../UI/Icons/CloseAiChatIcon.tsx'

import './SpecialistTopicsField.scss'

type Props = {
    selectedTopics: SymptomCode[]
    onChange: (topics: SymptomCode[]) => void
    className?: string
}

const layoutTransition = { type: 'spring' as const, stiffness: 350, damping: 30, mass: 0.8 }
const fadeTransition = { duration: 0.2, ease: 'easeOut' as const }

export const SpecialistTopicsField = ({ selectedTopics, onChange, className }: Props) => {
    const { t } = useTranslation('specialistProfileSettings')
    const { t: tSymptoms } = useTranslation('symptoms')

    const titleId = useId()
    const groupId = useId()
    const shouldReduceMotion = useReducedMotion()

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

    const layout = shouldReduceMotion ? { duration: 0 } : layoutTransition

    const tagMotion = {
        layout: true,
        initial: shouldReduceMotion ? false : { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 },
        transition: { layout, opacity: fadeTransition, scale: fadeTransition },
    }

    const groupMotion = {
        layout: true,
        initial: shouldReduceMotion ? false : { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { layout, opacity: fadeTransition },
    }

    const addTopic = (code: SymptomCode) => onChange([...selectedTopics, code])
    const removeTopic = (code: SymptomCode) =>
        onChange(selectedTopics.filter((topic) => topic !== code))

    return (
        <LayoutGroup id={groupId}>
            <section
                className={`topics-field ${className}`}
                aria-labelledby={titleId}
                aria-busy={isFetching}
            >
                <h2 className="visually-hidden" id={titleId}>
                    {t('topicsTitle')}
                </h2>

                <AnimatePresence initial={false} mode="popLayout">
                    {selectedTopics.length > 0 && (
                        <motion.div key="selected" {...groupMotion} className="topics-field__group">
                            <h3 className="topics-field__hint">{t('myTopics')}</h3>

                            <motion.ul layout transition={layout} className="topics-field__list">
                                <AnimatePresence initial={false} mode="popLayout">
                                    {selectedTopics.map((code) => {
                                        const label = tSymptoms(`${code}.title` as const)

                                        return (
                                            <motion.li
                                                key={code}
                                                layoutId={`topic-${code}`}
                                                {...tagMotion}
                                            >
                                                <TagButton
                                                    variant="green"
                                                    isSelected
                                                    aria-label={t('removeTopic', { topic: label })}
                                                    onClick={() => removeTopic(code)}
                                                    endIcon={<CloseAiChatIcon />}
                                                >
                                                    {label}
                                                </TagButton>
                                            </motion.li>
                                        )
                                    })}
                                </AnimatePresence>
                            </motion.ul>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence initial={false} mode="popLayout">
                    {(isLoading || isError || availableTopics.length > 0) && (
                        <motion.div key="available" {...groupMotion} className="topics-field__group">
                            <h3 className="topics-field__hint">{t('topicsHint')}</h3>

                            {isLoading && (
                                <p className="topics-field__hint" role="status">
                                    {t('topicsLoading')}
                                </p>
                            )}

                            {isError && (
                                <div className="topics-field__error-box" role="alert">
                                    <p className="topics-field__error">{t('topicsLoadError')}</p>

                                    <PrimaryButton
                                        type="button"
                                        disabled={isFetching}
                                        onClick={() => void refetch()}
                                    >
                                        {t('retry')}
                                    </PrimaryButton>
                                </div>
                            )}

                            <motion.ul layout transition={layout} className="topics-field__list">
                                <AnimatePresence initial={false} mode="popLayout">
                                    {availableTopics.map((code) => (
                                        <motion.li
                                            key={code}
                                            layoutId={`topic-${code}`}
                                            {...tagMotion}
                                        >
                                            <TagButton
                                                variant="green"
                                                onClick={() => addTopic(code)}
                                            >
                                                {tSymptoms(`${code}.title` as const)}
                                            </TagButton>
                                        </motion.li>
                                    ))}
                                </AnimatePresence>
                            </motion.ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </LayoutGroup>
    )
}