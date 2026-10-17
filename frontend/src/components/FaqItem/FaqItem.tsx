import classNames from 'classnames'
import { ArrowTopIcon } from '../UI/Icons/ArrowTopIcon'

import './FaqItem.scss'

type FaqItemProps = {
    id: string
    question: string
    answer: string
    isOpen: boolean
    onToggle: () => void
}

export const FaqItem = ({ id, question, answer, isOpen, onToggle }: FaqItemProps) => (
    <div
        className={classNames('faq-item', {
            'faq-item--is-open': isOpen,
        })}
    >
        <button
            type="button"
            aria-expanded={isOpen}
            id={`faq-trigger-${id}`}
            aria-controls={`faq-panel-${id}`}
            className="faq-item__header"
            onClick={onToggle}
        >
            <span className="faq-item__question">{question}</span>
            <span className="faq-item__wrapper-icon" aria-hidden="true">
                <ArrowTopIcon
                    className={classNames('faq-item__arrow-icon', {
                        'faq-item__arrow-icon--rotate': isOpen,
                    })}
                />
            </span>
        </button>
        <div className="faq-item__panel" id={`faq-panel-${id}`} aria-hidden={!isOpen}>
            <div className="faq-item__panel-inner">
                <p className="faq-item__answer">{answer}</p>
            </div>
        </div>
    </div>
)
