import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useGetSymptomCodesQuery } from '../../../services/psychologistsApi.ts'
import type { SymptomCode } from '../../../types/psychologist.ts'

import { OutlineButton, PrimaryButton, TagButton } from '../../UI/Buttons'
import { ArrowIcon } from '../../UI/Icons'

import './CatalogFilters.scss'
import { TimeSlot } from '../../UI/TimeSlot'

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

    const [values, setValues] = useState(createEmptyFilters)

    const { data: topics = [], isLoading, isError, isFetching, refetch } = useGetSymptomCodesQuery()

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

                <div className="catalog-filters__options">
                    <TagButton
                        isSelected={values.topics.length === 0}
                        onClick={() => setValues((previous) => ({ ...previous, topics: [] }))}
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
                </div>

                {isLoading && (
                    <p className="catalog-filters__message" role="status">
                        {t('topicsLoading')}
                    </p>
                )}

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
