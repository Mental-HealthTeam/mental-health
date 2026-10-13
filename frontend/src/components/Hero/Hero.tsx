import { useTranslation } from 'react-i18next'

import heroDesktopImage from '../../assets/images/hero/hero-desktop.png'
import heroMobileImage from '../../assets/images/hero/hero-mobile.png'

import { avatars } from '../../constants/avatars'
import { openAiChat } from '../../app/store/slices/aiChatSlice'
import { useAppDispatch } from '../../app/hooks'

import { AvatarGroup } from '../UI/Avatar'
import { Search } from '../UI/Search'

import './Hero.scss'

export const Hero = () => {
    const { t } = useTranslation('hero')
    const dispatch = useAppDispatch()

    const handleOpenChat = () => {
        dispatch(openAiChat())
    }

    return (
        <section className="hero">
            <div className="container hero__container">
                <h1 className="hero__title">
                    {t('title')} <br className="hero__title-break" />
                    <span className="hero__title-accent">{t('titleAccent')}</span>
                </h1>

                <p className="hero__subtitle">{t('subtitle')}</p>

                <Search
                    className="hero__search"
                    onSubmit={handleOpenChat}
                    placeholder={t('search.placeholder')}
                    buttonText={t('search.button')}
                />

                <div className="hero__media">
                    <div className="hero__image-wrap">
                        <picture>
                            <source media="(max-width: 767px)" srcSet={heroMobileImage} />

                            <img
                                src={heroDesktopImage}
                                alt={t('imageAlt')}
                                className="hero__image"
                            />
                        </picture>

                        <picture aria-hidden="true">
                            <source media="(max-width: 767px)" srcSet={heroMobileImage} />

                            <img
                                src={heroDesktopImage}
                                alt=""
                                className="hero__image hero__image--blur"
                            />
                        </picture>
                    </div>

                    <div className="hero__region-stat">
                        <div className="hero__stat-wrap hero__stat-wrap--users">
                            <div className="hero__stat hero__stat--users">
                                <p className="hero__stat-value">
                                    <span className="hero__stat-value-mobile">+10k</span>

                                    <span className="hero__stat-value-desktop">10 000</span>
                                </p>

                                <p className="hero__stat-text">{t('stats.users')}</p>
                            </div>
                        </div>

                        <div className="hero__stat-wrap hero__stat-wrap--specialists">
                            <div className="hero__stat hero__stat--specialists">
                                <AvatarGroup
                                    avatars={avatars}
                                    size="medium"
                                    className="hero__avatars-group"
                                />

                                <p className="hero__stat-text">
                                    <span className="hero__stat-specialists-mobile">
                                        {t('stats.specialistsMobile')}
                                    </span>

                                    <span className="hero__stat-specialists-desktop">
                                        {t('stats.specialistsDesktop')}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
