import { type CSSProperties, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useScreenLayout } from '../../hooks'
import { useGetPsychologistsQuery, useGetSymptomCodesQuery } from '../../services/psychologistsApi'

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

    const { t } = useTranslation(['psychologists', 'symptoms'])
    const { visibleCards } = useScreenLayout()

    const [activeFilter, setActiveFilter] = useState<string>(ALL_FILTER)

    const {
        data: symptomCodes = [],
        isLoading: isSymptomsLoading,
        isError: isSymptomsError,
    } = useGetSymptomCodesQuery()

    const availableFilters = SPECIALISTS_FILTER_CODES.filter((code) => symptomCodes.includes(code))

    const selectedSymptomCodes =
        activeFilter !== ALL_FILTER &&
        activeFilter !== EMERGENCY_FILTER &&
        symptomCodes.includes(activeFilter)
            ? [activeFilter]
            : undefined

    const {
        currentData: specialists = [],
        isLoading: isSpecialistsLoading,
        isFetching: isSpecialistsFetching,
        isError: isSpecialistsError,
    } = useGetPsychologistsQuery({
        limit: DEFAULT_LIMIT,
        offset: 0,
        symptomCodes: selectedSymptomCodes,
    })

    const sliderStyle = {
        '--visible-cards': visibleCards,
    } as CSSProperties

    const isAllActive = activeFilter === ALL_FILTER
    const isEmergencyActive = activeFilter === EMERGENCY_FILTER

    const isSpecialistsPending = isSpecialistsLoading || isSpecialistsFetching

    const hasSpecialists = specialists.length > 0

    const hasDesktopNavigation = specialists.length > visibleCards

    const hasMobileNavigation = specialists.length > 1

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter)

        sliderRef.current?.scrollTo({
            left: 0,
            behavior: 'smooth',
        })
    }

    const handlePrevious = () => {
        const slider = sliderRef.current

        if (!slider) {
            return
        }

        slider.scrollBy({
            left: -(slider.clientWidth + SLIDER_GAP),
            behavior: 'smooth',
        })
    }

    const handleNext = () => {
        const slider = sliderRef.current

        if (!slider) {
            return
        }

        slider.scrollBy({
            left: slider.clientWidth + SLIDER_GAP,
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
                        aria-label={t('psychologists:section.filtersLabel')}
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
                                    {t(`symptoms:${code}`)}
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

                {isSymptomsError && (
                    <p className="specialists-section__status">
                        {t('psychologists:section.filtersError')}
                    </p>
                )}

                {isSpecialistsPending && (
                    <p className="specialists-section__status">
                        {t('psychologists:section.loading')}
                    </p>
                )}

                {!isSpecialistsPending && isSpecialistsError && (
                    <p className="specialists-section__status">
                        {t('psychologists:section.specialistsError')}
                    </p>
                )}

                {!isSpecialistsPending && !isSpecialistsError && !hasSpecialists && (
                    <p className="specialists-section__status">
                        {t('psychologists:section.empty')}
                    </p>
                )}

                {!isSpecialistsPending && !isSpecialistsError && hasSpecialists && (
                    <>
                        <div className="specialists-section__carousel">
                            {hasDesktopNavigation && (
                                <div className="specialists-section__side-navigation">
                                    <ArrowButton
                                        direction="left"
                                        ariaLabel={t('psychologists:section.previous')}
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
                                            <SpecialistCard
                                                id={specialist.psychologist_id}
                                                name={specialist.full_name}
                                                avatar={specialist.avatar_url}
                                                experience={specialist.experience_years}
                                                price={specialist.price_per_hour}
                                                methods={specialist.methods}
                                                topics={specialist.specialization}
                                                timeSlots={specialist.mock_slots}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {hasDesktopNavigation && (
                                <div className="specialists-section__side-navigation">
                                    <ArrowButton
                                        direction="right"
                                        ariaLabel={t('psychologists:section.next')}
                                        onClick={handleNext}
                                    />
                                </div>
                            )}
                        </div>

                        {hasMobileNavigation && (
                            <div className="specialists-section__mobile-navigation">
                                <ArrowButton
                                    direction="left"
                                    ariaLabel={t('psychologists:section.previous')}
                                    onClick={handlePrevious}
                                />

                                <ArrowButton
                                    direction="right"
                                    ariaLabel={t('psychologists:section.next')}
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
