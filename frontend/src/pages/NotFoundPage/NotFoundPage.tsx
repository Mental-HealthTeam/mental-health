import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import umbrellaImage from '../../assets/images/errors/umbrella.png'
import { Container } from '../../components/Container'
import { Header } from '../../components/Header'
import { BackButton } from '../../components/UI/Buttons/BackButton'

import './NotFoundPage.scss'

export const NotFoundPage = () => {
    const { t } = useTranslation('errors')

    return (
        <div className="not-found-page">
            <Header variant="page" />

            <main className="not-found-page__main">
                <Container className="not-found-page__container">
                    <BackButton className="not-found-page__back" />

                    <section
                        className="not-found-page__content"
                        aria-labelledby="not-found-page-title"
                    >
                        <h1 className="not-found-page__title" id="not-found-page-title">
                            {t('notFoundPage.title')}
                        </h1>

                        <p className="not-found-page__description">
                            {t('notFoundPage.description')}
                        </p>

                        <img
                            className="not-found-page__image"
                            src={umbrellaImage}
                            alt=""
                            width={318}
                            height={266}
                        />

                        <div className="not-found-page__actions">
                            <Link className="not-found-page__specialists-link" to="/#psychologists">
                                {t('notFoundPage.specialistsLink')}

                                <span aria-hidden="true">→</span>
                            </Link>

                            <Link className="not-found-page__home-link" to="/">
                                {t('notFoundPage.homeLink')}
                            </Link>
                        </div>
                    </section>
                </Container>
            </main>

            <footer className="not-found-page__footer">
                <Container>
                    <p>
                        {t('notFoundPage.copyright', {
                            year: new Date().getFullYear(),
                        })}
                    </p>
                </Container>
            </footer>
        </div>
    )
}
