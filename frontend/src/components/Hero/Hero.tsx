import { useTranslation } from 'react-i18next'
import { formatCount } from '../../utils/formatCount'
import heroImage from '../../assets/hero-image.png'
import { Search } from '../UI/Search'
import './Hero.scss'
import { AvatarGroup } from '../UI/Avatar'
import { avatars } from '../../constants/avatars'

const USERS_COUNT = 1000
const SPECIALISTS_COUNT = 50

export const Hero = () => {
    const { t } = useTranslation('home')

    const handleSubmit = (value: string) => {
        return value
    }

    return (
        <section className="hero">
            <div className="container hero__container">
                <h1 className="hero__title">
                    {t('hero.title')} <br className="hero__title-break" />
                    <span className="hero__title-accent">{t('hero.titleAccent')}</span>
                </h1>
                <p className="hero__subtitle">{t('hero.subtitle')}</p>

                <Search
                    className="hero__search"
                    onSubmit={handleSubmit}
                    placeholder={t('hero.search.placeholder')}
                    buttonText={t('hero.search.button')}
                />

                <div className="hero__media">
                    <div className="hero__image-wrap">
                        <img src={heroImage} alt={t('hero.imageAlt')} className="hero__image" />
                        <img
                            src={heroImage}
                            alt=""
                            aria-hidden="true"
                            className="hero__image hero__image--blur"
                        />
                    </div>

                    <div className="hero__region-stat">
                        <div className="hero__stat hero__stat--users">
                            <p className="hero__stat-value">{formatCount(USERS_COUNT)}</p>
                            <p className="hero__stat-text">{t('hero.stats.users')}</p>
                        </div>

                        <div className="hero__stat hero__stat--specialists">
                            <AvatarGroup
                                avatars={avatars}
                                size="medium"
                                className="hero__avatars-group"
                            />
                            <p className="hero__stat-text">
                                {formatCount(SPECIALISTS_COUNT)} {t('hero.stats.specialists')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
