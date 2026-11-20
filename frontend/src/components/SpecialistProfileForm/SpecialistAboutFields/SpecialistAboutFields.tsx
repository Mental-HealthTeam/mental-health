import { useTranslation } from 'react-i18next'
import { FormField } from '../../UI/Form/FormField'
import { CloseIcon } from '../../UI/Icons'
import type { SpecialistProfileErrors } from '../specialistProfile.schema'

import './SpecialistAboutFields.scss'

type Props = {
    about: string
    certificates: string[]
    errors: SpecialistProfileErrors
    onAboutChange: (value: string) => void
    onCertificatesChange: (value: string[]) => void
}

const MAX_LENGHT = 255

export const SpecialistAboutFields = ({
    about,
    certificates,
    errors,
    onAboutChange,
    onCertificatesChange,
}: Props) => {
    const { t } = useTranslation('specialistProfileSettings')
    const items = certificates.length > 0 ? certificates : ['']

    const handleItemChange = (index: number, title: string) => {
        onCertificatesChange(items.map((item, i) => (i === index ? title : item)))
    }

    const handleAdd = () => {
        onCertificatesChange([...items, ''])
    }

    const handleRemove = (index: number) => {
        onCertificatesChange(items.filter((_, i) => i !== index))
    }

    return (
        <div className="specialist-about-fields">
            <FormField
                variant="textarea"
                id="about"
                name="about"
                label={t(`about.label`)}
                placeholder={t(`about.placeholder`)}
                inputMode="text"
                maxLength={MAX_LENGHT}
                autoComplete="off"
                value={about}
                error={errors.about}
                onChange={(e) => onAboutChange(e.target.value)}
            />
            <div className="specialist-about-fields__education">
                {items.map((item, index) => (
                    <div className="specialist-about-fields__row" key={index}>
                        <FormField
                            variant="textarea"
                            id={`education-${index}`}
                            name="education"
                            label={t(`education.label`)}
                            placeholder={t(`education.placeholder`)}
                            inputMode="text"
                            maxLength={MAX_LENGHT}
                            autoComplete="off"
                            value={item}
                            error={errors.certificates}
                            onChange={(e) => handleItemChange(index, e.target.value)}
                        />

                        {items.length > 1 && (
                            <button
                                type="button"
                                className="specialist-about-fields__remove"
                                onClick={() => handleRemove(index)}
                                aria-label={t('education.remove')}
                            >
                                <CloseIcon className="specialist-about-fields__close-icon" />
                            </button>
                        )}
                    </div>
                ))}

                {items.length <= 5 && (
                    <button
                        type="button"
                        className="specialist-about-fields__button-add"
                        onClick={handleAdd}
                    >
                        {t('education.add')}
                    </button>
                )}
            </div>
        </div>
    )
}
