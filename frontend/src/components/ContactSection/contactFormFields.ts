import type { ContactFormFieldName } from './types'

type ContactFormField = {
    name: ContactFormFieldName
    labelKey: 'form.name.label' | 'form.contact.label' | 'form.message.label'
    placeholderKey:
        'form.name.placeholder' | 'form.contact.placeholder' | 'form.message.placeholder'
    multiline?: boolean
    autoComplete?: string
}

export const CONTACT_FORM_FIELDS: ContactFormField[] = [
    {
        name: 'name',
        labelKey: 'form.name.label',
        placeholderKey: 'form.name.placeholder',
        autoComplete: 'name',
    },
    {
        name: 'contact',
        labelKey: 'form.contact.label',
        placeholderKey: 'form.contact.placeholder',
    },
    {
        name: 'message',
        labelKey: 'form.message.label',
        placeholderKey: 'form.message.placeholder',
        multiline: true,
    },
]
