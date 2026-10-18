import classNames from 'classnames'
import './ChatInput.scss'
import { Button } from '../../UI/Button'
import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import { ArrowTopIcon } from '../../UI/Icons/ArrowTopIcon'
import { useTranslation } from 'react-i18next'

type Props = {
    className?: string
    disabled: boolean
    initialValue: string
    onSend: (text: string) => void
}

export const ChatInput = ({ className, onSend, disabled, initialValue = '' }: Props) => {
    const { t } = useTranslation('aiChat')

    const [value, setValue] = useState(initialValue)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (value) {
            const trimmed = value.trim()
            onSend(trimmed)
            setValue('')
            inputRef.current?.focus()
        }
    }

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    return (
        <form className={classNames('chat-input', className)} onSubmit={handleSubmit}>
            <textarea
                name={t('input.label')}
                id="chat-input__field"
                rows={2}
                className="chat-input__field"
                maxLength={500}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={t('input.placeholder')}
                ref={inputRef}
            ></textarea>

            <Button
                className="chat-input__send"
                type="submit"
                variant="primary"
                size="small"
                ariaLabel={t('input.sendAriaLabel')}
                disabled={disabled}
                endIcon={<ArrowTopIcon />}
            />
        </form>
    )
}
