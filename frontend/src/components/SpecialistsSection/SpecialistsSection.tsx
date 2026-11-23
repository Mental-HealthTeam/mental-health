import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useScreenLayout } from '../../hooks'
import {
    useGetSymptomCodesQuery,
    useLazyGetPsychologistsQuery,
} from '../../services/psychologistsApi'
import type { Psychologist, SymptomCode } from '../../types/psychologist'

import { Container } from '../Container'
import { SpecialistCard, SpecialistCardSkeleton } from '../SpecialistCard'
import { ArrowButton } from '../UI/ArrowButton'
import { OutlineButton, TagButton, TagButtonSkeleton } from '../UI/Buttons'
import { SectionIndex } from '../UI/SectionIndex'

import { SPECIALISTS_FILTER_CODES } from './specialistsFilters'

import './SpecialistsSection.scss'

const SLIDER_GAP = 16
const DEFAULT_LIMIT = 5

const ALL_FILTER = 'all'
const EMERGENCY_FILTER = 'emergency'

const cardContentHidden = { '--specialist-content-opacity': 0 }
const cardContentVisible = { '--specialist-content-opacity': 1 }

export const SpecialistsSection = () => {
    const sliderRef = useRef<HTMLDivElement>(null)

    const { t, i18n } = useTranslation(['psychologists', 'symptoms', 'accessibility'])
    const lang = i18n.language === 'en' ? 'en' : 'uk'

    const { visibleCards } = useScreenLayout()
    const navigate = useNavigate()
    const prefersReducedMotion = useReducedMotion()

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

    const selectedSymptomCode =
        activeFilter !== ALL_FILTER &&
        activeFilter !== EMERGENCY_FILTER &&
        symptomCodes.includes(activeFilter as SymptomCode)
            ? (activeFilter as SymptomCode)
            : undefined

    const selectedSymptomCodes = useMemo<SymptomCode[] | undefined>(
        () => (selectedSymptomCode ? [selectedSymptomCode] : undefined),
        [selectedSymptomCode],
    )

    const sliderStyle = {
        '--visible-cards': visibleCards,
    } as CSSProperties

    const isAllActive = activeFilter === ALL_FILTER
    const isEmergencyActive = activeFilter === EMERGENCY_FILTER
    const hasSpecialists = specialists.length > 0

    const hasDesktopNavigation = specialists.length > visibleCards || hasMore
    const hasMobileNavigation = specialists.length > 1 || hasMore
    const hideDesktopNavigation = isInitialLoading || !hasDesktopNavigation
    const hideMobileNavigation = isInitialLoading || !hasMobileNavigation

    const slides = isInitialLoading
        ? Array.from({ length: DEFAULT_LIMIT }, () => undefined)
        : specialists

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
    }, [activeFilter, lang, getPsychologists, selectedSymptomCodes])

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

                {!isSymptomsError && (
                    <div
                        className="specialists-section__filters"
                        aria-label={t('accessibility:specialistsFilters')}
                        aria-busy={isSymptomsLoading}
                    >
                        {isSymptomsLoading ? (
                            <>
                                <TagButtonSkeleton />

                                {SPECIALISTS_FILTER_CODES.map((code) => (
                                    <TagButtonSkeleton key={code} />
                                ))}

                                <TagButtonSkeleton />
                            </>
                        ) : (
                            <>
                                <TagButton
                                    isSelected={isAllActive}
                                    onClick={() => handleFilterChange(ALL_FILTER)}
                                >
                                    {t('psychologists:section.all')}
                                </TagButton>

                                {availableFilters.map((code) => (
                                    <TagButton
                                        key={code}
                                        isSelected={activeFilter === code}
                                        onClick={() => handleFilterChange(code)}
                                    >
                                        {t(`symptoms:${code}.title`)}
                                    </TagButton>
                                ))}

                                <TagButton
                                    isSelected={isEmergencyActive}
                                    onClick={() => handleFilterChange(EMERGENCY_FILTER)}
                                >
                                    {t('psychologists:section.emergency')}
                                </TagButton>
                            </>
                        )}
                    </div>
                )}

                {/* TODO: Extract loading, error and empty states into a reusable Status/ErrorState component. */}
                {isSymptomsError && (
                    <p className="specialists-section__status">
                        {t('psychologists:section.filtersError')}
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

                {(isInitialLoading || hasSpecialists) && (
                    <>
                        <div className="specialists-section__carousel" aria-busy={isInitialLoading}>
                            <div
                                className="specialists-section__side-navigation"
                                aria-hidden={hideDesktopNavigation}
                            >
                                <ArrowButton
                                    direction="left"
                                    ariaLabel={t('accessibility:previousSpecialist')}
                                    onClick={handlePrevious}
                                />
                            </div>

                            <div
                                className="specialists-section__slider-wrapper"
                                style={sliderStyle}
                            >
                                <div className="specialists-section__slider" ref={sliderRef}>
                                    {slides.map((specialist, index) => (
                                        <div className="specialists-section__slide" key={index}>
                                            <AnimatePresence mode="wait">
                                                {specialist ? (
                                                    <motion.div
                                                        key={specialist.psychologist_id}
                                                        className="specialists-section__slide-content"
                                                        initial={
                                                            prefersReducedMotion
                                                                ? false
                                                                : cardContentHidden
                                                        }
                                                        animate={cardContentVisible}
                                                        exit={{
                                                            ...cardContentHidden,
                                                            transition: {
                                                                duration: prefersReducedMotion
                                                                    ? 0
                                                                    : 0.18,
                                                                ease: 'easeOut',
                                                            },
                                                        }}
                                                        transition={{
                                                            duration: prefersReducedMotion
                                                                ? 0
                                                                : 0.5,
                                                            ease: 'easeInOut',
                                                        }}
                                                    >
                                                        <SpecialistCard {...specialist} />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="skeleton"
                                                        className="specialists-section__slide-content"
                                                        aria-hidden="true"
                                                        initial={false}
                                                        animate={cardContentVisible}
                                                        exit={cardContentHidden}
                                                        transition={{
                                                            duration: prefersReducedMotion
                                                                ? 0
                                                                : 0.18,
                                                            ease: 'easeOut',
                                                        }}
                                                    >
                                                        <SpecialistCardSkeleton />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div
                                className="specialists-section__side-navigation"
                                aria-hidden={hideDesktopNavigation}
                            >
                                <ArrowButton
                                    direction="right"
                                    ariaLabel={t('accessibility:nextSpecialist')}
                                    onClick={handleNext}
                                />
                            </div>
                        </div>

                        {isInitialLoading && (
                            <span className="specialists-section__loading-label" role="status">
                                {t('psychologists:section.loading')}
                            </span>
                        )}

                        <div
                            className="specialists-section__mobile-navigation"
                            aria-hidden={hideMobileNavigation}
                        >
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
                    </>
                )}

                <OutlineButton
                    className="specialists-section__all-button"
                    variant="secondary"
                    onClick={() => navigate('/catalog', { state: { scrollToTop: true } })}
                >
                    {t('psychologists:section.viewAll')}
                </OutlineButton>
            </Container>
        </section>
    )
}
