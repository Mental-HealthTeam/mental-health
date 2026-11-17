import { FormField } from '../../../../components/UI/Form/FormField'
import './AboutField.scss'

type Props = {
    value: string
    onChange: (value: string) => void
}

export const AboutField = ({ onChange, value }: Props) => {
    return (
        <div className="about-field">
            <FormField
                id="about"
                label="Про Тебе"
                placeholder="Опиши з якими запитами працюєш"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    )
}
