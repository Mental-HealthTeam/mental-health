import { useTranslation } from 'react-i18next'

import { Button } from '../UI/Button'
import { ArrowRightIcon } from '../UI/Icons'

import './WhyChooseUs.scss'
import { SectionIndex } from '../UI/SectionIndex'

export const WhyChooseUs = () => {
    const { t } = useTranslation('home')

    return (
        <section className="why-us" id="about">
            <div className="container why-us__container">
                <SectionIndex number='02' className="why-us__section-index"/>

                <div className="why-us__intro">
                    <h2 className="why-us__title">{t('whyChooseUs.title')}</h2>
                    <p className="why-us__description">{t('whyChooseUs.description')}</p>
                </div>

                <ul className="why-us__list">
                    <li className="why-us__item">
                        <h3 className="why-us__item-title">
                            {t('whyChooseUs.items.relationships.title')}
                        </h3>
                        <p className="why-us__item-text">
                            {t('whyChooseUs.items.relationships.text')}
                        </p>
                    </li>
                    <li className="why-us__item">
                        <h3 className="why-us__item-title">
                            {t('whyChooseUs.items.specialists.title')}
                        </h3>
                        <p className="why-us__item-text">
                            {t('whyChooseUs.items.specialists.text')}
                        </p>
                    </li>
                    <li className="why-us__item">
                        <h3 className="why-us__item-title">{t('whyChooseUs.items.space.title')}</h3>
                        <p className="why-us__item-text">{t('whyChooseUs.items.space.text')}</p>
                    </li>
                    <li className="why-us__item">
                        <h3 className="why-us__item-title">
                            {t('whyChooseUs.items.learning.title')}
                        </h3>
                        <p className="why-us__item-text">{t('whyChooseUs.items.learning.text')}</p>
                    </li>

                    <li className="why-us__item">
                        <h3 className="why-us__item-title">
                            {t('whyChooseUs.items.support.title')}
                        </h3>
                        <p className="why-us__item-text">{t('whyChooseUs.items.support.text')}</p>
                    </li>

                    <li className="why-us__item">
                        <h3 className="why-us__item-title">
                            {t('whyChooseUs.items.balance.title')}
                        </h3>
                        <p className="why-us__item-text">{t('whyChooseUs.items.balance.text')}</p>
                    </li>
                </ul>

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
