import { useTranslation } from 'react-i18next'

import handshakeImage from '../../assets/images/why-choose-us/handshake.png'
import womanImage from '../../assets/images/why-choose-us/woman.png'

import { whyChooseUs } from '../../constants/whyChooseUs'
import { useAppDispatch } from '../../app/hooks'
import { openAiChat } from '../../app/store/slices/aiChatSlice'

import { PrimaryButton } from '../UI/Buttons'
import { ArrowIcon } from '../UI/Icons'
import { SectionIndex } from '../UI/SectionIndex'

import './WhyChooseUs.scss'

export const WhyChooseUs = () => {
    const { t } = useTranslation('whyChooseUs')
    const dispatch = useAppDispatch()

    const handleOpenChat = () => {
        dispatch(openAiChat())
    }

    return (
        <section className="why-choose-platform" id="about">
            <div className="container why-choose-platform__container">
                <SectionIndex index={2} className="why-choose-platform__section-index" />

                <div className="why-choose-platform__content">
                    <div className="why-choose-platform__intro">
                        <h2 className="why-choose-platform__title">
                            <span className="why-choose-platform__title-row">
                                <img
                                    className="why-choose-platform__title-image why-choose-platform__title-image--handshake"
                                    src={handshakeImage}
                                    alt=""
                                    aria-hidden="true"
                                />

                                <span>{t('titleStart')}</span>
                            </span>

                            <span className="why-choose-platform__title-row">
                                {t('titleBrand')}
                            </span>

                            <span className="why-choose-platform__title-row">
                                <span>{t('titleHealth')}</span>

                                <img
                                    className="why-choose-platform__title-image why-choose-platform__title-image--woman"
                                    src={womanImage}
                                    alt=""
                                    aria-hidden="true"
                                />

                                <span>?</span>
                            </span>
                        </h2>

                        <p className="why-choose-platform__description">{t('description')}</p>

                        <PrimaryButton
                            className="why-choose-platform__button"
                            endIcon={<ArrowIcon />}
                            aria-label={t('cta')}
                            onClick={handleOpenChat}
                        >
                            {t('cta')}
                        </PrimaryButton>
                    </div>

                    <ul className="why-choose-platform__list">
                        {whyChooseUs.map(({ id, labelKey, titleKey, Icon }) => (
                            <li className="why-choose-platform__item" key={id}>
                                <div className="why-choose-platform__item-label">
                                    <Icon
                                        className="why-choose-platform__item-icon"
                                        aria-hidden="true"
                                    />

                                    <span>{t(labelKey)}</span>
                                </div>

                                <h3 className="why-choose-platform__item-title">{t(titleKey)}</h3>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    )
}
