import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'

import type { SymptomCode } from '../../../types/psychologist.ts'
import { useGetSymptomCodesQuery } from '../../../services/psychologistsApi.ts'

import { PrimaryButton, TagButton } from '../../UI/Buttons'
import { CloseAiChatIcon } from '../../UI/Icons/CloseAiChatIcon.tsx'

import './ClientTopicsField.scss'

type Props = {
    selectedTopics: SymptomCode[]
    onChange: (topics: SymptomCode[]) => void
}

const layoutTransition = {
    type: 'spring' as const,
    stiffness: 350,
    damping: 30,
    mass: 0.8,
}

const visibilityTransition = {
    duration: 0.2,
    ease: 'easeOut' as const,
}

export const ClientTopicsField = ({ selectedTopics, onChange }: Props) => {
    const { t } = useTranslation('clientProfileSettings')
    const { t: tSymptoms } = useTranslation('symptoms')

    const titleId = useId()
    const layoutId = useId()

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

    const transition = shouldReduceMotion ? { duration: 0 } : layoutTransition

    const itemAnimation = {
        initial: shouldReduceMotion ? false : { opacity: 0, scale: 0.95 },

        animate: {
            opacity: 1,
            scale: 1,
        },

        exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 },
    }

    const addTopic = (code: SymptomCode) => {
        onChange([...selectedTopics, code])
    }

    const removeTopic = (code: SymptomCode) => {
        onChange(selectedTopics.filter((topic) => topic !== code))
    }

    return (
        <LayoutGroup id={layoutId}>
            <motion.section
                layout
                transition={transition}
                className="client-profile-form__panel"
                aria-labelledby={titleId}
                aria-busy={isFetching}
            >
                <h2 className="client-profile-form__title" id={titleId}>
                    {t('topicsTitle')}
                </h2>

                <AnimatePresence initial={false} mode="popLayout">
                    {selectedTopics.length > 0 && (
                        <motion.div
                            key="selected-topics"
                            layout
                            initial={shouldReduceMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{
                                layout: transition,
                                opacity: visibilityTransition,
                            }}
                            className="client-profile-form__topic-group"
                        >
                            <h3 className="client-profile-form__hint">{t('myTopics')}</h3>

                            <motion.ul
                                layout
                                transition={transition}
                                className="client-profile-form__topics"
                            >
                                <AnimatePresence initial={false} mode="popLayout">
                                    {selectedTopics.map((code) => {
                                        const label = tSymptoms(`${code}.title` as const)

                                        return (
                                            <motion.li
                                                key={code}
                                                layout
                                                layoutId={`topic-${code}`}
                                                {...itemAnimation}
                                                transition={{
                                                    layout: transition,
                                                    opacity: visibilityTransition,
                                                    scale: visibilityTransition,
                                                }}
                                            >
                                                <TagButton
                                                    variant="green"
                                                    isSelected
                                                    aria-label={t('removeTopic', {
                                                        topic: label,
                                                    })}
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
                        <motion.div
                            key="available-topics"
                            layout
                            initial={shouldReduceMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{
                                layout: transition,
                                opacity: visibilityTransition,
                            }}
                            className="client-profile-form__topic-group"
                        >
                            <h3 className="client-profile-form__hint">{t('topicsHint')}</h3>

                            {isLoading && (
                                <p className="client-profile-form__hint" role="status">
                                    {t('topicsLoading')}
                                </p>
                            )}

                            {isError && (
                                <div className="client-profile-form__topics-error" role="alert">
                                    <p className="client-profile-form__error">
                                        {t('topicsLoadError')}
                                    </p>

                                    <PrimaryButton
                                        type="button"
                                        disabled={isFetching}
                                        onClick={() => void refetch()}
                                    >
                                        {t('retry')}
                                    </PrimaryButton>
                                </div>
                            )}

                            <motion.ul
                                layout
                                transition={transition}
                                className="client-profile-form__topics"
                            >
                                <AnimatePresence initial={false} mode="popLayout">
                                    {availableTopics.map((code) => (
                                        <motion.li
                                            key={code}
                                            layout
                                            layoutId={`topic-${code}`}
                                            {...itemAnimation}
                                            transition={{
                                                layout: transition,
                                                opacity: visibilityTransition,
                                                scale: visibilityTransition,
                                            }}
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
            </motion.section>
        </LayoutGroup>
    )
}
