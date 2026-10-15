export type ContactFormValues = {
    name: string
    contact: string
    message: string
}

export type ContactFormFieldName = keyof ContactFormValues

export type ContactFormErrors = Partial<Record<ContactFormFieldName, string>>

export type ContactFormValidationMessages = {
    nameRequired: string
    nameInvalid: string
    contactRequired: string
    contactInvalid: string
    messageRequired: string
    messageInvalid: string
}
