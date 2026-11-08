import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAppDispatch } from '../../app/hooks'
import { openAiChat } from '../../app/store/slices/aiChatSlice'

import { AiChat } from '../../components/AiChat'
import { CatalogFilterPanel, CatalogResults } from '../../components/Catalog'
import type { CatalogFilterValues, CatalogQuery } from '../../components/Catalog'
import { Container } from '../../components/Container'
import { BackButton } from '../../components/UI/Buttons'
import { Search } from '../../components/UI/Search'

import './CatalogPage.scss'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

const createEmptyFilters = (): CatalogFilterValues => ({
    topics: [],
    minPrice: '',
    maxPrice: '',
    day: '',
})

export const CatalogPage = () => {
    const { t, i18n } = useTranslation('catalog')
    const dispatch = useAppDispatch()
    const titleId = useId()

    const [filters, setFilters] = useState(createEmptyFilters)

    const lang = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'uk'

    const params: CatalogQuery = {
        lang,
        symptomCodes: filters.topics,
        minPrice: filters.minPrice === '' ? undefined : Number(filters.minPrice),
        maxPrice: filters.maxPrice === '' ? undefined : Number(filters.maxPrice),
        availableDay: filters.day || undefined,
    }

    const handleApply = (values: CatalogFilterValues) => {
        setFilters({
            topics: [...new Set(values.topics)].sort(),
            minPrice: values.minPrice,
            maxPrice: values.maxPrice,
            day: values.day,
        })
    }

    const handleSearch = (value: string) => {
        if (value) {
            dispatch(openAiChat())
        }
    }

    return (
        <div className="catalog-page">
            <Header variant="page" />
            <main className="catalog-page__main">
                <Container className="catalog-page__container">
                    <BackButton className="catalog-page__back" />

                    <div className="catalog-page__search">
                        <p className="catalog-page__hint">{t('searchHint')}</p>

                        <Search
                            fullWidth
                            placeholder={t('searchPlaceholder')}
                            buttonText={t('searchButton')}
                            onSubmit={handleSearch}
                        />
                    </div>

                    <section aria-labelledby={titleId}>
                        <CatalogFilterPanel titleId={titleId} onApply={handleApply} />

                        <CatalogResults params={params} />
                    </section>
                </Container>
            </main>

            <AiChat />
            <Footer />
        </div>
    )
}
