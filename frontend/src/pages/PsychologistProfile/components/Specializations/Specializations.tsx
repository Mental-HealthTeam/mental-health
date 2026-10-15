import classNames from 'classnames'
import { BalanceIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { SectionLabel } from '../../../../components/UI/SectionLabel'
import './Specializations.scss'
import { Tag } from '../../../../components/UI/Tag'

type Props = {
    className?: string
}

const TAGS = ['Тривожність', 'Вигорання', 'Депресія', 'Самооцінка', 'Стосунки'] as const

export const Specializations = ({ className }: Props) => {
    return (
        <section
            className={classNames('specializations', className)}
            aria-labelledby="specializations-title"
        >
            <SectionLabel className="specializations__section-label" startIcon={<BalanceIcon />}>
                Напрямки роботи
            </SectionLabel>

            <div className="specializations__tags">
                {TAGS.map((item, i) => {
                    return (
                        <Tag className="specializations__tag" key={i}>
                            {item}
                        </Tag>
                    )
                })}
            </div>

            <hr className="specializations__divider" />

            <ul className="specializations__list">
                <li className="specializations__item">
                    Тривожні стани, панічні атаки, постійне відчуття напруги
                </li>
                <li className="specializations__item">
                    Емоційне вигорання, втрата мотивації та хронічна втома
                </li>
                <li className="specializations__item">
                    Депресивний настрій, апатія, втрата радості
                </li>
                <li className="specializations__item">
                    Складнощі у стосунках, встановлення особистих кордонів
                </li>
                <li className="specializations__item">
                    Низька самооцінка, синдром самозванця, невпевненість у собі
                </li>
            </ul>
        </section>
    )
}
