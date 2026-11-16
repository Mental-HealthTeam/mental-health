import type { ButtonHTMLAttributes } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'

import { FiltersIcon } from '../../Icons'

import './FilterButton.scss'

type Props = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'aria-expanded' | 'aria-controls'
> & {
    isOpen: boolean
    controls: string
}

export const FilterButton = ({
    isOpen,
    controls,
    className,
    type = 'button',
    'aria-label': ariaLabel,
    ...props
}: Props) => {
    const { t } = useTranslation('catalog')

    return (
        <button
            {...props}
            className={classNames('filter-button', { 'filter-button--active': isOpen }, className)}
            type={type}
            aria-label={ariaLabel ?? t('filters')}
            aria-expanded={isOpen}
            aria-controls={controls}
        >
            <FiltersIcon className="filter-button__icon" aria-hidden="true" focusable="false" />

            <span className="filter-button__text">{t('filters')}</span>
        </button>
    )
}
