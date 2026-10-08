import classNames from 'classnames'

import './SectionIndex.scss'

type Props = {
    index: number
    className: string
}

export const SectionIndex = ({ index, className }: Props) => {
    const readyIndex = String(index).padStart(2, '0')

    return (
        <div className={classNames('section-index', className)} aria-hidden="true">
            <span  className="section-index__number">{readyIndex}</span >
            <span  className="section-index__line" />
        </div>
    )
}
