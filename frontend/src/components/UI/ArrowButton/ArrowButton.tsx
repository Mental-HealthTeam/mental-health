import classNames from 'classnames'

import { ArrowIcon, type ArrowDirection } from '../Icons/ArrowIcon'

import './ArrowButton.scss'

type Props = {
    direction: ArrowDirection
    disabled?: boolean
    ariaLabel: string
    className?: string
    onClick?: () => void
}

export const ArrowButton = ({
    direction,
    disabled = false,
    ariaLabel,
    className,
    onClick,
}: Props) => {
    return (
        <button
            className={classNames('arrow-button', className)}
            type="button"
            disabled={disabled}
            aria-label={ariaLabel}
            onClick={onClick}
        >
            <ArrowIcon direction={direction} />
        </button>
    )
}
