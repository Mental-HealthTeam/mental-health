import type { ComponentType, SVGProps } from 'react'

type IconProps = Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & {
    width?: number
    height?: number
}

type Props = {
    icon: ComponentType<IconProps>
    label: string
    value: string
    href?: string
    external?: boolean
}

export const ContactItem = ({ icon: Icon, label, value, href, external = false }: Props) => {
    const content = (
        <>
            <Icon className="contact-section__contact-icon" aria-hidden="true" />

            <div className="contact-section__contact-content">
                <span className="contact-section__label">{label}</span>

                <strong className="contact-section__value">{value}</strong>
            </div>
        </>
    )

    if (href) {
        return (
            <a
                className="contact-section__contact-item contact-section__contact-item--link"
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
            >
                {content}
            </a>
        )
    }

    return <div className="contact-section__contact-item">{content}</div>
}
