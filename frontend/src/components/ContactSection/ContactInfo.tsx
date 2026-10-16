import { useTranslation } from 'react-i18next'

import { SectionIndex } from '../UI/SectionIndex'

import { ContactItem } from './ContactItem'
import { CONTACT_GROUPS } from './contactData'

export const ContactInfo = () => {
    const { t } = useTranslation('contact')

    return (
        <div className="contact-section__info">
            <SectionIndex index={7} className="contact-section__section-index" />

            <h2 className="contact-section__title">{t('title')}</h2>

            <div className="contact-section__contacts">
                {CONTACT_GROUPS.map((group) => (
                    <div className="contact-section__contact-group" key={group.titleKey}>
                        <h3 className="contact-section__group-title">{t(group.titleKey)}</h3>

                        <div className="contact-section__contact-grid">
                            {group.items.map((item) => (
                                <ContactItem
                                    key={item.id}
                                    icon={item.icon}
                                    label={t(item.labelKey)}
                                    value={t(item.valueKey)}
                                    href={'href' in item ? item.href : undefined}
                                    external={'external' in item ? item.external : undefined}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="contact-section__specialist-cta">
                <div className="contact-section__specialist-content">
                    <strong className="contact-section__specialist-title">
                        {t('specialist.title')}
                    </strong>

                    <p className="contact-section__specialist-text">{t('specialist.text')}</p>
                </div>

                <button className="contact-section__specialist-button" type="button">
                    {t('specialist.button')}
                </button>
            </div>
        </div>
    )
}
