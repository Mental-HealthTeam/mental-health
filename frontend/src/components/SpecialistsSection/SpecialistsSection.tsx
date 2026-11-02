import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useScreenLayout } from '../../hooks'
import {
    useGetSymptomCodesQuery,
    useLazyGetPsychologistsQuery,
} from '../../services/psychologistsApi'
import type { Psychologist, SymptomCode } from '../../types/psychologist'

import { Container } from '../Container'
import { SpecialistCard } from '../SpecialistCard'
import { ArrowButton } from '../UI/ArrowButton'
import { OutlineButton } from '../UI/Buttons'
import { SectionIndex } from '../UI/SectionIndex'

import { SPECIALISTS_FILTER_CODES } from './specialistsFilters'

import './SpecialistsSection.scss'

const SLIDER_GAP = 16
const DEFAULT_LIMIT = 5

const ALL_FILTER = 'all'
const EMERGENCY_FILTER = 'emergency'

export const SpecialistsSection = () => {
    const sliderRef = useRef<HTMLDivElement>(null)

    const { t, i18n } = useTranslation(['psychologists', 'symptoms', 'accessibility'])

    const lang = i18n.language === 'en' ? 'en' : 'uk'

    const { visibleCards } = useScreenLayout()

    const [activeFilter, setActiveFilter] = useState<string>(ALL_FILTER)

    const [specialists, setSpecialists] = useState<Psychologist[]>([])

    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(true)

    const [isInitialLoading, setIsInitialLoading] = useState(true)

    const {
        data: symptomCodes = [],
        isLoading: isSymptomsLoading,
        isError: isSymptomsError,
    } = useGetSymptomCodesQuery()

    const [getPsychologists, { isFetching: isSpecialistsFetching, isError: isSpecialistsError }] =
        useLazyGetPsychologistsQuery()

    const availableFilters = SPECIALISTS_FILTER_CODES.filter((code) => symptomCodes.includes(code))

    const selectedSymptomCodes: SymptomCode[] | undefined =
        activeFilter !== ALL_FILTER &&
        activeFilter !== EMERGENCY_FILTER &&
        symptomCodes.includes(activeFilter as SymptomCode)
            ? [activeFilter as SymptomCode]
            : undefined

    const sliderStyle = {
        '--visible-cards': visibleCards,
    } as CSSProperties

    const isAllActive = activeFilter === ALL_FILTER

    const isEmergencyActive = activeFilter === EMERGENCY_FILTER

    const hasSpecialists = specialists.length > 0

    const hasDesktopNavigation = specialists.length > visibleCards || hasMore

    const hasMobileNavigation = specialists.length > 1 || hasMore

    const getSlideStep = () => {
        const slider = sliderRef.current

        if (!slider) {
            return 0
        }

        const firstSlide = slider.querySelector<HTMLElement>('.specialists-section__slide')

        if (!firstSlide) {
            return 0
        }

        return firstSlide.offsetWidth + SLIDER_GAP
    }

    const loadSpecialists = async (nextOffset: number, replace = false) => {
        try {
            const result = await getPsychologists({
                limit: DEFAULT_LIMIT,
                offset: nextOffset,
                symptomCodes: selectedSymptomCodes,
                lang,
            }).unwrap()

            setSpecialists((current) => (replace ? result : [...current, ...result]))

            setOffset(nextOffset)

            setHasMore(result.length === DEFAULT_LIMIT)
        } catch {
            if (replace) {
                setSpecialists([])
            }
        } finally {
            if (replace) {
                setIsInitialLoading(false)
            }
        }
    }

    useEffect(() => {
        sliderRef.current?.scrollTo({
            left: 0,
        })

        void getPsychologists({
            limit: DEFAULT_LIMIT,
            offset: 0,
            symptomCodes: selectedSymptomCodes,
            lang,
        })
            .unwrap()
            .then((result) => {
                setSpecialists(result)
                setOffset(0)
                setHasMore(result.length === DEFAULT_LIMIT)
            })
            .catch(() => {
                setSpecialists([])
            })
            .finally(() => {
                setIsInitialLoading(false)
            })
    }, [activeFilter, lang])

    const handleFilterChange = (filter: string) => {
        if (filter === activeFilter) {
            return
        }

        setSpecialists([])
        setOffset(0)
        setHasMore(true)
        setIsInitialLoading(true)
        setActiveFilter(filter)
    }

    const handlePrevious = () => {
        const slider = sliderRef.current
        const slideStep = getSlideStep()

        if (!slider || !slideStep) {
            return
        }

        slider.scrollBy({
            left: -slideStep,
            behavior: 'smooth',
        })
    }

    const handleNext = async () => {
        const slider = sliderRef.current
        const slideStep = getSlideStep()

        if (!slider || !slideStep) {
            return
        }

        const isAtEnd = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - SLIDER_GAP

        if (isAtEnd && hasMore && !isSpecialistsFetching) {
            await loadSpecialists(offset + DEFAULT_LIMIT)

            requestAnimationFrame(() => {
                slider.scrollBy({
                    left: slideStep,
                    behavior: 'smooth',
                })
            })

            return
        }

        slider.scrollBy({
            left: slideStep,
            behavior: 'smooth',
        })
    }

    return (
        <section className="specialists-section">
            <Container className="specialists-section__container">
                <SectionIndex index={3} className="specialists-section__section-index" />

                <h2 className="specialists-section__title">{t('psychologists:section.title')}</h2>

                {!isSymptomsLoading && !isSymptomsError && (
                    <div
                        className="specialists-section__filters"
                        aria-label={t('accessibility:specialistsFilters')}
                    >
                        <button
                            className={`specialists-section__filter ${
                                isAllActive ? 'specialists-section__filter--active' : ''
                            }`}
                            type="button"
                            aria-pressed={isAllActive}
                            onClick={() => handleFilterChange(ALL_FILTER)}
                        >
                            {t('psychologists:section.all')}
                        </button>

                        {availableFilters.map((code) => {
                            const isActive = activeFilter === code

                            return (
                                <button
                                    className={`specialists-section__filter ${
                                        isActive ? 'specialists-section__filter--active' : ''
                                    }`}
                                    type="button"
                                    key={code}
                                    aria-pressed={isActive}
                                    onClick={() => handleFilterChange(code)}
                                >
                                    {t(`symptoms:${code}.title`)}
                                </button>
                            )
                        })}

                        <button
                            className={`specialists-section__filter ${
                                isEmergencyActive ? 'specialists-section__filter--active' : ''
                            }`}
                            type="button"
                            aria-pressed={isEmergencyActive}
                            onClick={() => handleFilterChange(EMERGENCY_FILTER)}
                        >
                            {t('psychologists:section.emergency')}
                        </button>
                    </div>
                )}

                {/* TODO: Extract loading, error and empty states into a reusable Status/ErrorState component. */}
                {isSymptomsError && (
                    <p className="specialists-section__status">
                        {t('psychologists:section.filtersError')}
                    </p>
                )}

                {/* TODO: Add reusable StatusState for loading/error/empty states,
                    ErrorBoundary for runtime/render errors,
                    and Zod runtime validation for psychologists API responses. */}
                {isInitialLoading && (
                    <p className="specialists-section__status">
                        {t('psychologists:section.loading')}
                    </p>
                )}

                {!isInitialLoading && isSpecialistsError && !hasSpecialists && (
                    <p className="specialists-section__status">
                        {t('psychologists:section.specialistsError')}
                    </p>
                )}

                {!isInitialLoading && !isSpecialistsError && !hasSpecialists && (
                    <p className="specialists-section__status">
                        {t('psychologists:section.empty')}
                    </p>
                )}

                {!isInitialLoading && hasSpecialists && (
                    <>
                        <div className="specialists-section__carousel">
                            {hasDesktopNavigation && (
                                <div className="specialists-section__side-navigation">
                                    <ArrowButton
                                        direction="left"
                                        ariaLabel={t('accessibility:previousSpecialist')}
                                        onClick={handlePrevious}
                                    />
                                </div>
                            )}

                            <div
                                className="specialists-section__slider-wrapper"
                                style={sliderStyle}
                            >
                                <div className="specialists-section__slider" ref={sliderRef}>
                                    {specialists.map((specialist) => (
                                        <div
                                            className="specialists-section__slide"
                                            key={specialist.psychologist_id}
                                        >
                                            <SpecialistCard {...specialist} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {hasDesktopNavigation && (
                                <div className="specialists-section__side-navigation">
                                    <ArrowButton
                                        direction="right"
                                        ariaLabel={t('accessibility:nextSpecialist')}
                                        onClick={handleNext}
                                    />
                                </div>
                            )}
                        </div>

                        {hasMobileNavigation && (
                            <div className="specialists-section__mobile-navigation">
                                <ArrowButton
                                    direction="left"
                                    ariaLabel={t('accessibility:previousSpecialist')}
                                    onClick={handlePrevious}
                                />

                                <ArrowButton
                                    direction="right"
                                    ariaLabel={t('accessibility:nextSpecialist')}
                                    onClick={handleNext}
                                />
                            </div>
                        )}
                    </>
                )}

                <OutlineButton className="specialists-section__all-button" variant="secondary">
                    {t('psychologists:section.viewAll')}
                </OutlineButton>
            </Container>
        </section>
    )
}
