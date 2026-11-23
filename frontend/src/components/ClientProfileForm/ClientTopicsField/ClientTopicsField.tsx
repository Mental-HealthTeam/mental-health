import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'

import { useGetSymptomCodesQuery } from '../../../services/psychologistsApi.ts'
import type { SymptomCode } from '../../../types/psychologist.ts'

import { PrimaryButton, TagButton, TagButtonSkeleton } from '../../UI/Buttons'
import { CloseAiChatIcon } from '../../UI/Icons/CloseAiChatIcon.tsx'

import './ClientTopicsField.scss'

type Props = {
    selectedTopics: SymptomCode[]
    onChange: (topics: SymptomCode[]) => void
}

const TOPIC_SKELETON_WIDTHS = [
    143, 125, 123, 74, 154, 137, 191, 187, 174, 64, 92, 135, 197, 133, 192, 185, 123,
]

const layoutTransition = {
    type: 'spring' as const,
    stiffness: 350,
    damping: 30,
    mass: 0.8,
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

    const showTopicSkeletons = isLoading && !isError
    const transition = shouldReduceMotion ? { duration: 0 } : layoutTransition

    const visibilityTransition = {
        duration: shouldReduceMotion ? 0 : 0.2,
        ease: 'easeOut' as const,
    }

    const itemAnimation = {
        initial: shouldReduceMotion ? (false as const) : { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
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
            >
                <h2 className="client-profile-form__title" id={titleId}>
                    {t('topicsTitle')}
                </h2>

                <span className="client-profile-form__topics-loading" role="status">
                    {showTopicSkeletons ? t('topicsLoading') : ''}
                </span>

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
                    {(showTopicSkeletons || isError || availableTopics.length > 0) && (
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

                            <AnimatePresence initial={false} mode="wait">
                                {showTopicSkeletons ? (
                                    <motion.ul
                                        key="topic-skeletons"
                                        className="client-profile-form__topics"
                                        aria-hidden="true"
                                        initial={false}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={visibilityTransition}
                                    >
                                        {TOPIC_SKELETON_WIDTHS.map((width, index) => (
                                            <li
                                                key={index}
                                                className="client-profile-form__topic-skeleton"
                                            >
                                                <TagButtonSkeleton width={width} />
                                            </li>
                                        ))}
                                    </motion.ul>
                                ) : (
                                    <motion.ul
                                        key="topic-buttons"
                                        layout
                                        className="client-profile-form__topics"
                                        initial={shouldReduceMotion ? false : { opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{
                                            layout: transition,
                                            opacity: visibilityTransition,
                                        }}
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
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.section>
        </LayoutGroup>
    )
}
