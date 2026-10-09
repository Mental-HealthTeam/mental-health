import { useTranslation } from 'react-i18next'

import { Button } from '../UI/Button'
import { ArrowRightIcon } from '../UI/Icons'

import './WhyChooseUs.scss'
import { SectionIndex } from '../UI/SectionIndex'
import { whyChooseUs } from '../../constants/whyChooseUs'

export const WhyChooseUs = () => {
    const { t } = useTranslation('home')

    return (
        <section className="why-us" id="about">
            <div className="container why-us__container">
                <SectionIndex index={2} className="why-us__section-index" />

                <div className="why-us__content">
                    <div className="why-us__intro">
                        <h2 className="why-us__title">{t('whyChooseUs.title')}</h2>
                        <p className="why-us__description">{t('whyChooseUs.description')}</p>
                    </div>

                    <ul className="why-us__list">
                        {whyChooseUs.map((id) => (
                            <li className="why-us__item">
                                <h3 className="why-us__item-title">
                                    {t(`whyChooseUs.items.${id}.title`)}
                                </h3>
                                <p className="why-us__item-text">
                                    {t(`whyChooseUs.items.${id}.text`)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>

                <Button
                    className="why-us__button"
                    href="#ai-search"
                    variant="primary"
                    size="large"
                    endIcon={<ArrowRightIcon />}
                    ariaLabel={t('whyChooseUs.cta')}
                >
                    {t('whyChooseUs.cta')}
                </Button>
            </div>
        </section>
    )
}
