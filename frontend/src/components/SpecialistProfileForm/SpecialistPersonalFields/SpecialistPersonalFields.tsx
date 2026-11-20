import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { FormField } from '../../UI/Form/FormField'
import type {
    SpecialistProfileErrors,
    SpecialistProfileValues,
    SpecialistTextField,
} from '../specialistProfile.types'

import './SpecialistPersonalFields.scss'

type Props = {
    values: Pick<
        SpecialistProfileValues,
        'name' | 'experience_years' | 'price_per_hour' | 'approach'
    >
    errors: SpecialistProfileErrors
    onChange: (field: SpecialistTextField, value: string) => void
}

type FieldConfig = {
    name: 'name' | 'experience_years' | 'price_per_hour' | 'approach'
    inputMode?: 'numeric' | 'decimal'
    maxLength?: number
}

const fields: FieldConfig[] = [
    { name: 'name', maxLength: 255 },
    { name: 'experience_years', inputMode: 'numeric', maxLength: 2 },
    { name: 'price_per_hour', inputMode: 'decimal', maxLength: 7 },
    { name: 'approach', maxLength: 100 },
]

export const SpecialistPersonalFields = ({ values, errors, onChange }: Props) => {
    const { t } = useTranslation('specialistProfileSettings')
    const id = useId()

    return (
        <div className="specialist-personal-fields">
            {fields.map(({ name, inputMode, maxLength }) => (
                <FormField
                    key={name}
                    id={`${id}-${name}`}
                    name={name}
                    label={t(`fields.${name}.label`)}
                    placeholder={t(`fields.${name}.placeholder`)}
                    inputMode={inputMode}
                    maxLength={maxLength}
                    autoComplete="off"
                    value={values[name]}
                    error={errors[name]}
                    onChange={(event) => onChange(name, event.target.value)}
                />
            ))}
        </div>
    )
}