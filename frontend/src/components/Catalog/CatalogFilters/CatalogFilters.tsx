import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { useGetSymptomCodesQuery } from '../../../services/psychologistsApi.ts'
import type { SymptomCode } from '../../../types/psychologist.ts'

import { OutlineButton, PrimaryButton, TagButton, TagButtonSkeleton } from '../../UI/Buttons'
import { ArrowIcon } from '../../UI/Icons'
import { TimeSlot } from '../../UI/TimeSlot'

import './CatalogFilters.scss'

const TOPIC_SKELETON_WIDTHS = [
    56, 143, 125, 123, 74, 154, 137, 191, 187, 174, 64, 92, 135, 197, 133, 192, 185, 123,
]

export type CatalogFilterValues = {
    topics: SymptomCode[]
    minPrice: string
    maxPrice: string
    day: '' | 'today' | 'tomorrow'
}

type Props = {
    onApply: (values: CatalogFilterValues) => void
}

const createEmptyFilters = (): CatalogFilterValues => ({
    topics: [],
    minPrice: '',
    maxPrice: '',
    day: '',
})

export const CatalogFilters = ({ onApply }: Props) => {
    const { t } = useTranslation('catalog')
    const { t: tSymptoms } = useTranslation('symptoms')
    const id = useId()
    const prefersReducedMotion = useReducedMotion()

    const [values, setValues] = useState(createEmptyFilters)

    const { data: topics = [], isLoading, isError, isFetching, refetch } = useGetSymptomCodesQuery()

    const showTopicSkeletons = isLoading && !isError

    const hasPriceError =
        values.minPrice !== '' &&
        values.maxPrice !== '' &&
        Number(values.minPrice) > Number(values.maxPrice)

    const toggleTopic = (code: SymptomCode) => {
        setValues((previous) => ({
            ...previous,
            topics: previous.topics.includes(code)
                ? previous.topics.filter((topic) => topic !== code)
                : [...previous.topics, code],
        }))
    }

    const handleReset = () => {
        const emptyValues = createEmptyFilters()

        setValues(emptyValues)
        onApply(emptyValues)
    }

    return (
        <div className="catalog-filters">
            <fieldset className="catalog-filters__group">
                <legend className="catalog-filters__label">{t('topic')}</legend>

                <span className="catalog-filters__loading-label" role="status">
                    {showTopicSkeletons ? t('topicsLoading') : ''}
                </span>

                <AnimatePresence initial={false} mode="wait">
                    {showTopicSkeletons ? (
                        <motion.div
                            key="topic-skeletons"
                            className="catalog-filters__options catalog-filters__topic-skeletons"
                            aria-hidden="true"
                            exit={{
                                opacity: 0,
                                transition: {
                                    duration: prefersReducedMotion ? 0 : 0.16,
                                },
                            }}
                        >
                            {TOPIC_SKELETON_WIDTHS.map((width, index) => (
                                <TagButtonSkeleton key={index} width={width} />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="topic-buttons"
                            className="catalog-filters__options"
                            initial={prefersReducedMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{
                                duration: prefersReducedMotion ? 0 : 0.4,
                                ease: 'easeOut',
                            }}
                        >
                            <TagButton
                                isSelected={values.topics.length === 0}
                                onClick={() =>
                                    setValues((previous) => ({ ...previous, topics: [] }))
                                }
                            >
                                {t('all')}
                            </TagButton>

                            {topics.map((code) => (
                                <TagButton
                                    key={code}
                                    isSelected={values.topics.includes(code)}
                                    onClick={() => toggleTopic(code)}
                                >
                                    {tSymptoms(`${code}.title` as const)}
                                </TagButton>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {isError && (
                    <div className="catalog-filters__feedback">
                        <p className="catalog-filters__error" role="alert">
                            {t('topicsError')}
                        </p>

                        <OutlineButton disabled={isFetching} onClick={() => void refetch()}>
                            {t('retry')}
                        </OutlineButton>
                    </div>
                )}
            </fieldset>

            <fieldset className="catalog-filters__group">
                <legend className="catalog-filters__label">{t('price')}</legend>

                <div className="catalog-filters__prices">
                    <input
                        className="catalog-filters__input"
                        type="number"
                        min="0"
                        step="any"
                        inputMode="decimal"
                        aria-label={t('minPrice')}
                        aria-invalid={hasPriceError}
                        aria-describedby={hasPriceError ? `${id}-price-error` : undefined}
                        placeholder={t('from')}
                        value={values.minPrice}
                        onChange={(event) =>
                            setValues((previous) => ({
                                ...previous,
                                minPrice: event.target.value,
                            }))
                        }
                    />

                    <input
                        className="catalog-filters__input"
                        type="number"
                        min="0"
                        step="any"
                        inputMode="decimal"
                        aria-label={t('maxPrice')}
                        aria-invalid={hasPriceError}
                        aria-describedby={hasPriceError ? `${id}-price-error` : undefined}
                        placeholder={t('to')}
                        value={values.maxPrice}
                        onChange={(event) =>
                            setValues((previous) => ({
                                ...previous,
                                maxPrice: event.target.value,
                            }))
                        }
                    />
                </div>

                {hasPriceError && (
                    <p className="catalog-filters__error" id={`${id}-price-error`} role="alert">
                        {t('priceError')}
                    </p>
                )}
            </fieldset>

            <fieldset className="catalog-filters__group">
                <legend className="catalog-filters__label">{t('availableTime')}</legend>

                <div className="catalog-filters__options">
                    {(['today', 'tomorrow'] as const).map((day) => (
                        <TimeSlot
                            key={day}
                            label={t(day)}
                            name={`${id}-day`}
                            value={day}
                            checked={values.day === day}
                            onChange={() => setValues((previous) => ({ ...previous, day }))}
                        />
                    ))}
                </div>
            </fieldset>

            <div className="catalog-filters__actions">
                <PrimaryButton
                    disabled={
                        hasPriceError || Number(values.minPrice) < 0 || Number(values.maxPrice) < 0
                    }
                    endIcon={<ArrowIcon width={16} height={16} />}
                    onClick={() => onApply({ ...values, topics: [...values.topics] })}
                >
                    {t('apply')}
                </PrimaryButton>

                <OutlineButton onClick={handleReset}>{t('reset')}</OutlineButton>
            </div>
        </div>
    )
}
