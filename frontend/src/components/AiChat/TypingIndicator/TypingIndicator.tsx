import classNames from 'classnames'
import './TypingIndicator.scss'
import { PenIcon } from '../../UI/Icons'

type Props = {
    className?: string
}

export const TypingIndicator = ({ className }: Props) => {
    return (
        <div className={classNames('typing-indicator', className)}>
            <PenIcon className="typing-indicator__icon" />
            <div className="typing-indicator__text">Анна друкує...</div>
        </div>
    )
}
