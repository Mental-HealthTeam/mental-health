import type { ContactFormErrors, ContactFormValidationMessages, ContactFormValues } from './types'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEGRAM_REGEX = /^@[a-zA-Z0-9_]{5,32}$/

const MIN_NAME_LENGTH = 2
const MIN_MESSAGE_LENGTH = 10

const isValidContact = (value: string) => {
    const contact = value.trim()

    return EMAIL_REGEX.test(contact) || TELEGRAM_REGEX.test(contact)
}

export const validateContactForm = (
    values: ContactFormValues,
    messages: ContactFormValidationMessages,
): ContactFormErrors => {
    const errors: ContactFormErrors = {}

    const name = values.name.trim()
    const contact = values.contact.trim()
    const message = values.message.trim()

    if (!name) {
        errors.name = messages.nameRequired
    } else if (name.length < MIN_NAME_LENGTH) {
        errors.name = messages.nameInvalid
    }

    if (!contact) {
        errors.contact = messages.contactRequired
    } else if (!isValidContact(contact)) {
        errors.contact = messages.contactInvalid
    }

    if (!message) {
        errors.message = messages.messageRequired
    } else if (message.length < MIN_MESSAGE_LENGTH) {
        errors.message = messages.messageInvalid
    }

    return errors
}
