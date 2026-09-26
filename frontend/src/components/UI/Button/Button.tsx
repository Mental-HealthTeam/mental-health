import type {
    MouseEvent,
    MouseEventHandler,
    ReactNode,
} from 'react'
import classNames from 'classnames'
import './Button.scss'

type ButtonVariant = 'primary' | 'outline' | 'tag'
type ButtonSize = 'small' | 'large'

type Props = {
    children: ReactNode
    className?: string
    href?: string
    startIcon?: ReactNode
    endIcon?: ReactNode
    variant?: ButtonVariant
    size?: ButtonSize
    fullWidth?: boolean
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    ariaLabel?: string
    onClick?: MouseEventHandler<
        HTMLAnchorElement | HTMLButtonElement
    >
}

export const Button = ({
                           children,
                           className,
                           href,
                           startIcon,
                           endIcon,
                           variant = 'primary',
                           size = 'small',
                           fullWidth = false,
                           type = 'button',
                           disabled = false,
                           ariaLabel,
                           onClick,
                       }: Props) => {
    const buttonClassName = classNames(
        'button',
        `button--${variant}`,
        `button--${size}`,
        {
            'button--full-width': fullWidth,
            'button--disabled': disabled,
        },
        className,
    )

    const content = (
        <>
            {startIcon && (
                <span
                    className="button__icon button__icon--start"
                    aria-hidden="true"
                >
          {startIcon}
        </span>
            )}

            <span className="button__label">
        {children}
      </span>

            {endIcon && (
                <span
                    className="button__icon button__icon--end"
                    aria-hidden="true"
                >
          {endIcon}
        </span>
            )}
        </>
    )

    if (href) {
        const handleLinkClick = (
            event: MouseEvent<HTMLAnchorElement>,
        ) => {
            if (disabled) {
                event.preventDefault()
                return
            }

            onClick?.(event)
        }

        return (
            <a
                className={buttonClassName}
                href={disabled ? undefined : href}
                aria-label={ariaLabel}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : undefined}
                onClick={handleLinkClick}
            >
                {content}
            </a>
        )
    }

    return (
        <button
            className={buttonClassName}
            type={type}
            disabled={disabled}
            aria-label={ariaLabel}
            onClick={onClick}
        >
            {content}
        </button>
    )
}
