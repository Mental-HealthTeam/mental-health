import { BalanceIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { SectionLabel } from '../../../../components/UI/SectionLabel'
import './Specializations.scss'

export const Specializations = () => {
    return (
        <section className="specializations" aria-labelledby="specializations-title">
            <SectionLabel className="specializations__section-label" startIcon={<BalanceIcon />}>
                Напрямки роботи
            </SectionLabel>

            <ul className="specializations__tags">
                <li className="tag">Тривожність</li>
                <li className="tag">Вигорання</li>
                <li className="tag">Депресія</li>
                <li className="tag">Самооцінка</li>
                <li className="tag">Стосунки</li>
            </ul>

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
