import { FormField } from '../../../../components/UI/Form/FormField'
import { CloseIcon } from '../../../../components/UI/Icons'
import './EducationList.scss'

type Certificate = { title: string }

type Props = {
    value: Certificate[]
    onChange: (value: Certificate[]) => void
}

export const EducationList = ({ value, onChange }: Props) => {
    const items = value.length > 0 ? value : [{ title: '' }]

    const handleItemChange = (index: number, title: string) => {
        onChange(items.map((item, i) => (i === index ? { ...item, title } : item)))
    }

    const handleAdd = () => {
        onChange([...items, { title: '' }])
    }

    const handleRemove = (index: number) => {
        onChange(items.filter((_, i) => i !== index))
    }

    return (
        <div className="education-list">
            {items.map((item, index) => (
                <div className="education-list__row" key={index}>
                    <FormField
                        id={`education-${index}`}
                        label={index === 0 ? 'Освіта' : ''}
                        placeholder="Додай назву навчального закладу"
                        value={item.title}
                        onChange={(e) => handleItemChange(index, e.target.value)}
                    />

                    {items.length > 1 && (
                        <button
                            type="button"
                            className="education-list__remove"
                            onClick={() => handleRemove(index)}
                            aria-label="Видалити освіту"
                        >
                            <CloseIcon />
                        </button>
                    )}
                </div>
            ))}

            <button type="button" className="education-list__button-add" onClick={handleAdd}>
                Додати освіту
            </button>
        </div>
    )
}
