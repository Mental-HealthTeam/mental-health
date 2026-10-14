import './Specializations.scss'

export const Specializations = () => {
    return (
        <section className="specializations" aria-labelledby="specializations-title">
            <h2 className="specializations__title section-label" id="specializations-title">
                <svg
                    className="section-label__icon"
                    aria-hidden="true"
                    width="16"
                    height="16"
                ></svg>
                Напрямки роботи
            </h2>

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
