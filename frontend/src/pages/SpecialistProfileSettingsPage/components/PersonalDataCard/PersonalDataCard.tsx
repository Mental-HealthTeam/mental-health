import { FormField } from '../../../../components/UI/Form/FormField'
import type { OnFieldChange, ProfileFormState } from '../../../../types/specialist'
import './PersonalDataCard.scss'

type PersonalData = Pick<
    ProfileFormState,
    'name' | 'experience_years' | 'price_per_hour' | 'approach'
>

type Props = {
    values: PersonalData
    onChange: OnFieldChange
}

export const PersonalDataCard = ({ onChange, values }: Props) => {
    return (
        <div className="personal-data-card">
            <FormField
                id="name"
                label="Вкажи своє ім'я та прізвище"
                placeholder="Зазнач своє повне ім'я"
                value={values.name}
                onChange={(e) => onChange('name', e.target.value)}
            />

            <FormField
                id="experience"
                label="Досвід"
                placeholder="Зазнач свій досвід у роках"
                inputMode="numeric"
                value={values.experience_years}
                onChange={(e) => onChange('experience_years', e.target.value)}
            />

            <FormField
                id="price"
                label="Вартість сесії за 50 хв"
                placeholder="Зазнач вартість консультації"
                inputMode="numeric"
                value={values.price_per_hour}
                onChange={(e) => onChange('price_per_hour', e.target.value)}
            />

            <FormField
                id="approach"
                label="Терапевтичний підхід:"
                placeholder="Вкажи свої основні напрями та підходи"
                value={values.approach}
                onChange={(e) => onChange('approach', e.target.value)}
            />
        </div>
    )
}
