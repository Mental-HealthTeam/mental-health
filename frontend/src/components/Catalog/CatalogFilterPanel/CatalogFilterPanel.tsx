import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { CatalogFilterValues } from '../CatalogFilters'
import { CatalogFilters } from '../CatalogFilters'

import './CatalogFilterPanel.scss'
import { FilterButton } from '../../UI/Buttons'

type Props = {
    titleId: string
    onApply: (values: CatalogFilterValues) => void
}

export const CatalogFilterPanel = ({ titleId, onApply }: Props) => {
    const { t } = useTranslation('catalog')

    const filtersId = useId()
    const mobileFiltersId = useId()
    const mobileTitleId = useId()

    const dialogRef = useRef<HTMLDialogElement>(null)

    const [isDesktopOpen, setIsDesktopOpen] = useState(true)
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    useEffect(() => {
        if (!isMobileOpen) {
            return
        }

        const previousOverflow = document.body.style.overflow

        document.body.style.overflow = 'hidden'

        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [isMobileOpen])

    useEffect(() => {
        const media = window.matchMedia('(min-width: 768px)')

        const handleChange = () => {
            if (media.matches) {
                dialogRef.current?.close()
            }
        }

        media.addEventListener('change', handleChange)

        return () => {
            media.removeEventListener('change', handleChange)
        }
    }, [])

    const openMobileFilters = () => {
        const dialog = dialogRef.current

        if (!dialog || dialog.open) {
            return
        }

        dialog.showModal()
        setIsMobileOpen(true)
    }

    const handleMobileApply = (values: CatalogFilterValues) => {
        onApply(values)
        dialogRef.current?.close()
    }

    return (
        <div className="catalog-filter-panel">
            <div className="catalog-filter-panel__heading">
                <h1 className="catalog-filter-panel__title" id={titleId}>
                    {t('title')}
                </h1>

                <FilterButton
                    className="catalog-filter-panel__desktop-button"
                    isOpen={isDesktopOpen}
                    controls={filtersId}
                    onClick={() => setIsDesktopOpen((previous) => !previous)}
                />

                <FilterButton
                    className="catalog-filter-panel__mobile-button"
                    isOpen={isMobileOpen}
                    controls={mobileFiltersId}
                    aria-haspopup="dialog"
                    onClick={openMobileFilters}
                />
            </div>

            <div
                id={filtersId}
                className={`catalog-filter-panel__desktop${
                    isDesktopOpen ? ' catalog-filter-panel__desktop--open' : ''
                }`}
                inert={!isDesktopOpen}
                aria-hidden={!isDesktopOpen}
            >
                <div className="catalog-filter-panel__inner">
                    <CatalogFilters onApply={onApply} />
                </div>
            </div>

            <dialog
                ref={dialogRef}
                id={mobileFiltersId}
                className="catalog-filter-panel__dialog"
                aria-labelledby={mobileTitleId}
                onClose={() => setIsMobileOpen(false)}
            >
                <div className="catalog-filter-panel__card">
                    <h2 className="catalog-filter-panel__dialog-title" id={mobileTitleId}>
                        {t('filters')}
                    </h2>

                    <CatalogFilters onApply={handleMobileApply} />
                </div>
            </dialog>
        </div>
    )
}
