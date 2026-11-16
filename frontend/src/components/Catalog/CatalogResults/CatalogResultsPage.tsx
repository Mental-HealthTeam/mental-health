import { useTranslation } from 'react-i18next'

import { useGetPsychologistsQuery } from '../../../services/psychologistsApi'

import { SpecialistCard } from '../../SpecialistCard'
import { OutlineButton } from '../../UI/Buttons'
import { ArrowIcon } from '../../UI/Icons'

import type { CatalogQuery } from '../catalog.types'

type Props = {
    params: CatalogQuery
    limit: number
    offset: number
    isLast: boolean
    onLoadMore: () => void
}

export const CatalogResultsPage = ({ params, limit, offset, isLast, onLoadMore }: Props) => {
    const { t } = useTranslation('catalog')

    const {
        currentData: psychologists,
        isFetching,
        isError,
        refetch,
    } = useGetPsychologistsQuery({
        ...params,
        limit: limit + 1,
        offset,
    })

    const visiblePsychologists = psychologists?.slice(0, limit)
    const hasMore = (psychologists?.length ?? 0) > limit

    return (
        <>
            {visiblePsychologists?.map((psychologist) => (
                <SpecialistCard key={psychologist.psychologist_id} {...psychologist} />
            ))}

            {isFetching && (
                <p className="catalog-results__status catalog-results__wide" role="status">
                    {t('loading')}
                </p>
            )}

            {isError && (
                <div className="catalog-results__feedback catalog-results__wide">
                    <p className="catalog-results__error" role="alert">
                        {t('loadError')}
                    </p>

                    <OutlineButton disabled={isFetching} onClick={() => void refetch()}>
                        {t('retry')}
                    </OutlineButton>
                </div>
            )}

            {!isFetching && !isError && offset === 0 && psychologists?.length === 0 && (
                <p className="catalog-results__status catalog-results__wide" role="status">
                    {t('empty')}
                </p>
            )}

            {isLast && hasMore && !isError && !isFetching && (
                <div className="catalog-results__more catalog-results__wide">
                    <OutlineButton
                        endIcon={<ArrowIcon direction="down" width={12} height={12} />}
                        onClick={onLoadMore}
                    >
                        {t('showMore')}
                    </OutlineButton>
                </div>
            )}
        </>
    )
}
