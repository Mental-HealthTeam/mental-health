import './Search.scss'
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import classNames from 'classnames'
import { Button } from '../Button'
import { ArrowIcon, SearchIcon } from '../Icons'

type SearchSize = 'small' | 'medium' | 'large'

type Props = {
    className?: string

    size?: SearchSize

    fullWidth?: boolean
    disabled?: boolean

    name?: string
    placeholder?: string
    buttonText?: string
    ariaLabel?: string
    initialValue?: string

    onChange?: (value: string) => void
    onSubmit: (value: string) => void
}

export const Search = ({
    className,
    size = 'large',
    fullWidth = false,
    disabled = false,
    name = 'q',
    placeholder,
    buttonText,
    ariaLabel = placeholder,
    initialValue = '',
    onChange,
    onSubmit,
}: Props) => {
    const [value, setValue] = useState(initialValue)

    const searchClassName = classNames(
        'search',
        `search--${size}`,
        {
            'search--full-width': fullWidth,
            'search--disabled': disabled,
        },
        className,
    )

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value)
        onChange?.(event.target.value)
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (disabled) {
            return
        }

        onSubmit(value.trim())
    }

    return (
        <form className={searchClassName} role="search" onSubmit={handleSubmit}>
            <label className="search__field">
                <SearchIcon className="search__icon" />

                <input
                    className="search__input"
                    type="search"
                    value={value}
                    name={name}
                    aria-label={ariaLabel}
                    placeholder={placeholder}
                    autoComplete="off"
                    disabled={disabled}
                    onChange={handleChange}
                />
            </label>

            <Button
                className="search__button"
                type="submit"
                variant="primary"
                size={size}
                disabled={disabled}
                endIcon={<ArrowIcon />}
            >
                {buttonText}
            </Button>
        </form>
    )
}
