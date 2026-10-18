import { Container } from '../Container'
import { SectionIndex } from '../UI/SectionIndex'
import faqImage from '../../assets/images/faq-image.png'
import { FaqItem } from '../FaqItem'
import { FAQ_IDS } from '../../constants/faqs'
import { useState } from 'react'

import './FaqSection.scss'
import { ArrowIcon } from '../UI/Icons'
import { PrimaryButton } from '../UI/Buttons'
import { useTranslation } from 'react-i18next'

export const FaqSection = () => {
    const { t } = useTranslation('faq')
    const [openFaqId, setOpenFaqId] = useState<null | string>(null)

    return (
        <section className="faq-section">
            <Container className="faq-section__container">
                <div className="faq-section__intro">
                    <SectionIndex index={6} className="faq-section__section-index" />

                    <h2 className="faq-section__title" id="faq-section-title">
                        {t('title')}
                    </h2>

                    <p className="faq-section__subtitle">{t('subtitle')}</p>
                </div>

                <div className="faq-section__media">
                    <img className="faq-section__image" src={faqImage} alt="" loading="lazy" />
                </div>

                <ul className="faq-section__list">
                    {FAQ_IDS.map((id) => (
                        <li className="faq-section__item" key={id}>
                            <FaqItem
                                id={id}
                                question={t(`items.${id}.question`)}
                                answer={t(`items.${id}.answer`)}
                                isOpen={openFaqId === id}
                                onToggle={() => setOpenFaqId((prev) => (prev === id ? null : id))}
                            />
                        </li>
                    ))}
                </ul>

                <div className="faq-section__contact">
                    <p className="faq-section__contact-text">{t('contact.text')}</p>

                    <PrimaryButton className="faq-section__button" endIcon={<ArrowIcon />}>
                        {t('contact.button')}
                    </PrimaryButton>
                </div>
            </Container>
        </section>
    )
}
