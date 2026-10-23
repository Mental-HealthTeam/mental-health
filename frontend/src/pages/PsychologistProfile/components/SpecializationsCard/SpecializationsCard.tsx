import classNames from 'classnames'
import { BalanceIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { SectionLabel } from '../../../../components/UI/SectionLabel'
import './SpecializationsCard.scss'
import { Tag } from '../../../../components/UI/Tag'
import { useAppSelector } from '../../../../app/hooks'

type Props = {
    className?: string
}

export const SpecializationsCard = ({ className }: Props) => {
    const { profile } = useAppSelector((state) => state.specialistProfile)

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

            {profile && (
                <div className="specializations-card__tags">
                    {profile.topics.map((topic) => {
                        return (
                            <Tag className="specializations-card__tag" key={topic.id}>
                                {topic.title}
                            </Tag>
                        )
                    })}
                </div>
            )}

            <hr className="specializations-card__divider" />

            {profile && (
                <ul className="specializations-card__list">
                    {profile.topics.map((topic) => (
                        <li className="specializations-card__item" key={topic.id}>
                            {topic.description}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
