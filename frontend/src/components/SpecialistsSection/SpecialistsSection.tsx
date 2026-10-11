import { type CSSProperties, useRef, useState } from 'react'

import { useScreenLayout } from '../../hooks'

import { Container } from '../Container'
import { SpecialistCard } from '../SpecialistCard'
import { ArrowButton } from '../UI/ArrowButton'
import { Button } from '../UI/Button'
import { ArrowIcon } from '../UI/Icons'

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
]

const MOCK_SPECIALISTS = Array.from({ length: 5 }, (_, index) => ({
    id: index + 1,
}))

const SLIDER_GAP = 16

export const SpecialistsSection = () => {
    const sliderRef = useRef<HTMLDivElement>(null)

    const { visibleCards } = useScreenLayout()

    const [activeFilter, setActiveFilter] = useState('ВСІ')

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
                <div className="specialists-section__number">
                    <span>03</span>

                    <span className="specialists-section__number-line" aria-hidden="true" />
                </div>

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

                <div className="specialists-section__carousel">
                    <div className="specialists-section__side-navigation">
                        <ArrowButton
                            direction="left"
                            ariaLabel="Попередній фахівець"
                            onClick={handlePrevious}
                        />
                    </div>

                    <div className="specialists-section__slider-wrapper" style={sliderStyle}>
                        <div className="specialists-section__slider" ref={sliderRef}>
                            {MOCK_SPECIALISTS.map((specialist) => (
                                <div className="specialists-section__slide" key={specialist.id}>
                                    <SpecialistCard />
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

                <Button
                    className="specialists-section__all-button"
                    variant="primary"
                    size="medium"
                    endIcon={<ArrowIcon direction="right" />}
                >
                    ПЕРЕГЛЯНУТИ ВСІХ
                </Button>
            </Container>
        </section>
    )
}
