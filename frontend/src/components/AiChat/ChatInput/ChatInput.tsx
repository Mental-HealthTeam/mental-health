import classNames from 'classnames'
import './ChatInput.scss'
import { Button } from '../../UI/Button'
import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import { ArrowTopIcon } from '../../UI/Icons/ArrowTopIcon'
import { useTranslation } from 'react-i18next'

type Props = {
    className?: string
    disabled: boolean
    initialValue?: string
    onSend: (text: string) => void
}

const MAX_LENGTH = 500

export const ChatInput = ({ className, onSend, disabled, initialValue = '' }: Props) => {
    const { t } = useTranslation('aiChat')

    const [value, setValue] = useState(initialValue)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        const trimmed = value.trim()

        if (disabled || !trimmed) {
            return
        }

        onSend(trimmed)
        setValue('')
        inputRef.current?.focus()
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
            return
        }

        event.preventDefault()
        event.currentTarget.form?.requestSubmit()
    }

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    return (
        <form className={classNames('chat-input', className)} onSubmit={handleSubmit}>
            <textarea
                name={t('input.label')}
                rows={2}
                className="chat-input__field"
                maxLength={MAX_LENGTH}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('input.placeholder')}
                ref={inputRef}
            ></textarea>

            <Button
                className="chat-input__send"
                type="submit"
                variant="primary"
                size="small"
                ariaLabel={t('input.sendAriaLabel')}
                disabled={disabled || !value.trim()}
                endIcon={<ArrowTopIcon />}
            />
        </form>
    )
}
