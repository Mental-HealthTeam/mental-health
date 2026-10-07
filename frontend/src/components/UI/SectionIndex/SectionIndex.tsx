import classNames from 'classnames'

import './SectionIndex.scss'

type Props = {
    number: string
    className: string
}

export const SectionIndex = ({ number, className }: Props) => {
    return (
        <div className={classNames('section-index', className)} aria-hidden="true">
            <p className="section-index__number">{number}</p>
            <div className="section-index__line" />
        </div>
    )
}
