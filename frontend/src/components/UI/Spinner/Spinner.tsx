import classNames from 'classnames'

import './Spinner.scss'

type Props = {
    size?: 'small' | 'medium'
    className?: string
}

export const Spinner = ({ size = 'medium', className }: Props) => (
    <svg
        className={classNames('spinner', `spinner--${size}`, className)}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        focusable="false"
    >
        <circle
            cx="20"
            cy="20"
            r="18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="90 114"
            vectorEffect="non-scaling-stroke"
        />
    </svg>
)
