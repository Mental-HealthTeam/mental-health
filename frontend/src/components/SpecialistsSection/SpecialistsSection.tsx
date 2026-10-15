import { type CSSProperties, useRef, useState } from 'react'

import { useScreenLayout } from '../../hooks'
import { useGetPsychologistsQuery } from '../../services/psychologistsApi'

import { Container } from '../Container'
import { SpecialistCard } from '../SpecialistCard'
import { ArrowButton } from '../UI/ArrowButton'
import { OutlineButton } from '../UI/Buttons'
import { SectionIndex } from '../UI/SectionIndex'

import './SpecialistsSection.scss'

const FILTERS = [
    'ВСІ',
    'ВИГОРАННЯ',
    'ТРИВОЖНІСТЬ',
    'ДЕПРЕСІЯ',
    'СТРЕС',
    'САМООЦІНКА',
    'СТОСУНКИ',
    'ЕКСТРЕНИЙ ЗАПИС',
] as const

const SLIDER_GAP = 16

export const SpecialistsSection = () => {
    const sliderRef = useRef<HTMLDivElement>(null)

    const { visibleCards } = useScreenLayout()

    const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('ВСІ')

    const {
        data: specialists = [],
        isLoading,
        isError,
    } = useGetPsychologistsQuery({
        limit: 5,
        offset: 0,
    })

    const sliderStyle = {
        '--visible-cards': visibleCards,
    } as CSSProperties

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

                <h2 className="specialists-section__title">Наші фахівці</h2>

                <div className="specialists-section__filters" aria-label="Фільтри фахівців">
                    {FILTERS.map((filter) => {
                        const isActive = activeFilter === filter

                        return (
                            <button
                                className={`specialists-section__filter ${
                                    isActive ? 'specialists-section__filter--active' : ''
                                }`}
                                type="button"
                                key={filter}
                                aria-pressed={isActive}
                                onClick={() => setActiveFilter(filter)}
                            >
                                {filter}
                            </button>
                        )
                    })}
                </div>

                {isLoading && <p className="specialists-section__status">Завантаження...</p>}

                {isError && (
                    <p className="specialists-section__status">Не вдалося завантажити фахівців</p>
                )}

                {!isLoading && !isError && (
                    <>
                        <div className="specialists-section__carousel">
                            <div className="specialists-section__side-navigation">
                                <ArrowButton
                                    direction="left"
                                    ariaLabel="Попередній фахівець"
                                    onClick={handlePrevious}
                                />
                            </div>

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

                            <div className="specialists-section__side-navigation">
                                <ArrowButton
                                    direction="right"
                                    ariaLabel="Наступний фахівець"
                                    onClick={handleNext}
                                />
                            </div>
                        </div>

                        <div className="specialists-section__mobile-navigation">
                            <ArrowButton
                                direction="left"
                                ariaLabel="Попередній фахівець"
                                onClick={handlePrevious}
                            />

                            <ArrowButton
                                direction="right"
                                ariaLabel="Наступний фахівець"
                                onClick={handleNext}
                            />
                        </div>
                    </>
                )}

                <OutlineButton className="specialists-section__all-button" variant="secondary">
                    ПЕРЕГЛЯНУТИ ВСІХ
                </OutlineButton>
            </Container>
        </section>
    )
}
