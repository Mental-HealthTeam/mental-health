type WhyUsCard = {
    id: 'ai' | 'specialists' | 'availability' | 'speed' | 'matching' | 'flexibility'
    className: string
    type: 'default' | 'value' | 'matching'
    labelKey?: string
    captionKey?: string
    textKey: string
    valueKey?: string
}

export const whyUsCards = [
    {
        id: 'ai',
        className: 'why-us__card--ai',
        type: 'default',
        labelKey: 'ai.label',
        captionKey: 'ai.caption',
        textKey: 'ai.text',
    },
    {
        id: 'specialists',
        className: 'why-us__card--specialists',
        type: 'value',
        valueKey: 'specialists.value',
        textKey: 'specialists.text',
    },
    {
        id: 'availability',
        className: 'why-us__card--availability',
        type: 'value',
        valueKey: 'availability.value',
        textKey: 'availability.text',
    },
    {
        id: 'speed',
        className: 'why-us__card--speed',
        type: 'default',
        labelKey: 'speed.label',
        captionKey: 'speed.caption',
        textKey: 'speed.text',
    },
    {
        id: 'matching',
        className: 'why-us__card--matching',
        type: 'matching',
        valueKey: 'matching.value',
        textKey: 'matching.text',
    },
    {
        id: 'flexibility',
        className: 'why-us__card--flexibility',
        type: 'default',
        labelKey: 'flexibility.label',
        captionKey: 'flexibility.caption',
        textKey: 'flexibility.text',
    },
] as const satisfies readonly WhyUsCard[]
