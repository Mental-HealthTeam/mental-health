import classNames from 'classnames'
import { BalanceIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { SectionLabel } from '../../../../components/UI/SectionLabel'
import './SpecializationsCard.scss'
import { Tag } from '../../../../components/UI/Tag'

type Props = {
    className?: string
}

const TAGS = ['Тривожність', 'Вигорання', 'Депресія', 'Самооцінка', 'Стосунки'] as const

export const SpecializationsCard = ({ className }: Props) => {
    return (
        <section
            className={classNames('specializations-card', className)}
            aria-labelledby="specializations-card-title"
        >
            <SectionLabel
                className="specializations-card__section-label"
                startIcon={<BalanceIcon />}
            >
                Напрямки роботи
            </SectionLabel>

            <div className="specializations-card__tags">
                {TAGS.map((item, i) => {
                    return (
                        <Tag className="specializations-card__tag" key={i}>
                            {item}
                        </Tag>
                    )
                })}
            </div>

            <hr className="specializations-card__divider" />

            <ul className="specializations-card__list">
                <li className="specializations-card__item">
                    Тривожні стани, панічні атаки, постійне відчуття напруги
                </li>
                <li className="specializations-card__item">
                    Емоційне вигорання, втрата мотивації та хронічна втома
                </li>
                <li className="specializations-card__item">
                    Депресивний настрій, апатія, втрата радості
                </li>
                <li className="specializations-card__item">
                    Складнощі у стосунках, встановлення особистих кордонів
                </li>
                <li className="specializations-card__item">
                    Низька самооцінка, синдром самозванця, невпевненість у собі
                </li>
            </ul>
        </section>
    )
}
