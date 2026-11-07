import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAppDispatch } from '../../app/hooks'
import { openAiChat } from '../../app/store/slices/aiChatSlice'
import { useGetPsychologistsQuery } from '../../services/psychologistsApi'

import { AiChat } from '../../components/AiChat'
import type { CatalogFilterValues } from '../../components/CatalogFilters'
import { CatalogFilters } from '../../components/CatalogFilters'
import { Container } from '../../components/Container'
import { SpecialistCard } from '../../components/SpecialistCard'
import { Search } from '../../components/UI/Search'

import './CatalogPage.scss'
import { OutlineButton } from '../../components/UI/Buttons'
import { BackButton } from '../../components/UI/Buttons/BackButton'

const PAGE_SIZE = 6

const isSameDay = (first: Date, second: Date) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()

export const CatalogPage = () => {
    const { t, i18n } = useTranslation('catalog')
    const dispatch = useAppDispatch()
    const filtersId = useId()

    const [isFiltersOpen, setIsFiltersOpen] = useState(true)
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
    const [filters, setFilters] = useState<CatalogFilterValues>({
        topics: [],
        minPrice: '',
        maxPrice: '',
        day: '',
    })

    const lang = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'uk'

    const {
        currentData: psychologists = [],
        isFetching,
        isError,
        refetch,
    } = useGetPsychologistsQuery({
        limit: 50,
        offset: 0,
        lang,
    })

    const now = new Date()
    const targetDay = new Date(now)

    if (filters.day === 'tomorrow') {
        targetDay.setDate(targetDay.getDate() + 1)
    }

    const filteredPsychologists = psychologists.filter((psychologist) => {
        const matchesTopics =
            filters.topics.length === 0 ||
            filters.topics.some((topic) => psychologist.topics.includes(topic))

        const price = Number(psychologist.price_per_hour)

        const matchesPrice =
            (filters.minPrice === '' || price >= Number(filters.minPrice)) &&
            (filters.maxPrice === '' || price <= Number(filters.maxPrice))

        const matchesDay =
            filters.day === '' ||
            psychologist.mock_slots.some((slot) => {
                const date = new Date(slot.time)

                return date.getTime() > now.getTime() && isSameDay(date, targetDay)
            })

        return matchesTopics && matchesPrice && matchesDay
    })

    const handleApply = (values: CatalogFilterValues) => {
        setFilters(values)
        setVisibleCount(PAGE_SIZE)
    }

    return (
        <div className="catalog-page">
            <main className="catalog-page__main">
                <Container className="catalog-page__container">
                    <BackButton className="catalog-page__back" />

                    <div className="catalog-page__search">
                        <p className="catalog-page__hint">{t('searchHint')}</p>

                        <Search
                            fullWidth
                            placeholder={t('searchPlaceholder')}
                            buttonText={t('searchButton')}
                            onSubmit={(value) => {
                                if (value) {
                                    dispatch(openAiChat())
                                }
                            }}
                        />
                    </div>

                    <section aria-labelledby="catalog-title">
                        <div className="catalog-page__heading">
                            <h1 className="catalog-page__title" id="catalog-title">
                                {t('title')}
                            </h1>

                            <button
                                className="catalog-page__toggle"
                                type="button"
                                aria-expanded={isFiltersOpen}
                                aria-controls={filtersId}
                                onClick={() => setIsFiltersOpen((previous) => !previous)}
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    aria-hidden="true"
                                >
                                    <path d="M3 6h10m4 0h4M3 12h3m4 0h11M3 18h10m4 0h4" />
                                    <circle cx="15" cy="6" r="2" />
                                    <circle cx="8" cy="12" r="2" />
                                    <circle cx="15" cy="18" r="2" />
                                </svg>

                                {t('filters')}
                            </button>
                        </div>

                        <div id={filtersId} hidden={!isFiltersOpen}>
                            <CatalogFilters onApply={handleApply} />
                        </div>

                        <div className="catalog-page__results" aria-busy={isFetching}>
                            {isFetching && psychologists.length === 0 && (
                                <p className="catalog-page__status" role="status">
                                    {t('loading')}
                                </p>
                            )}

                            {isError && (
                                <div className="catalog-page__feedback">
                                    <p className="catalog-page__error" role="alert">
                                        {t('loadError')}
                                    </p>

                                    <OutlineButton
                                        disabled={isFetching}
                                        onClick={() => void refetch()}
                                    >
                                        {t('retry')}
                                    </OutlineButton>
                                </div>
                            )}

                            {!isFetching && !isError && filteredPsychologists.length === 0 && (
                                <p className="catalog-page__status" role="status">
                                    {t('empty')}
                                </p>
                            )}

                            <div className="catalog-page__grid">
                                {filteredPsychologists
                                    .slice(0, visibleCount)
                                    .map((psychologist) => (
                                        <SpecialistCard
                                            key={psychologist.psychologist_id}
                                            {...psychologist}
                                        />
                                    ))}
                            </div>

                            {visibleCount < filteredPsychologists.length && (
                                <div className="catalog-page__more">
                                    <OutlineButton
                                        onClick={() =>
                                            setVisibleCount((previous) => previous + PAGE_SIZE)
                                        }
                                    >
                                        {t('showMore')}
                                    </OutlineButton>
                                </div>
                            )}
                        </div>
                    </section>
                </Container>
            </main>

            <AiChat />
        </div>
    )
}
