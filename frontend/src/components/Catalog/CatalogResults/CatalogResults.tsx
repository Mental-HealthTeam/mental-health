import { useState } from 'react'

import type { CatalogQuery } from '../catalog.types'
import { CatalogResultsPage } from './CatalogResultsPage'

import './CatalogResults.scss'

const PAGE_SIZE = 6

type Props = {
    params: CatalogQuery
}

const CatalogResultsList = ({ params }: Props) => {
    const [pageCount, setPageCount] = useState(1)

    return (
        <div className="catalog-results">
            {Array.from({ length: pageCount }, (_, pageIndex) => (
                <CatalogResultsPage
                    key={pageIndex}
                    params={params}
                    limit={PAGE_SIZE}
                    offset={pageIndex * PAGE_SIZE}
                    isLast={pageIndex === pageCount - 1}
                    onLoadMore={() => setPageCount((previous) => previous + 1)}
                />
            ))}
        </div>
    )
}

export const CatalogResults = ({ params }: Props) => (
    <CatalogResultsList key={JSON.stringify(params)} params={params} />
)
