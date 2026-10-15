import { Container } from '../Container'

import { ContactForm } from './ContactForm'
import { ContactInfo } from './ContactInfo'

import './ContactSection.scss'

export const ContactSection = () => {
    return (
        <section className="contact-section">
            <Container className="contact-section__container">
                <ContactInfo />

                <ContactForm />
            </Container>
        </section>
    )
}
