import type { ComponentType } from 'react'

import {
    BalanceIcon,
    CreateIcon,
    HelpIcon,
    LearnIcon,
    SearchSpecialistIcon,
    SupportIcon,
} from '../components/UI/Icons/WhyChoosePlatform'

import type { IconProps } from '../components/UI/Icons/WhyChoosePlatform'

type WhyChooseUsItemId =
    'relationships' | 'specialists' | 'space' | 'learning' | 'support' | 'balance'

type WhyChooseUsItem = {
    [Key in WhyChooseUsItemId]: {
        id: Key
        labelKey: `items.${Key}.label`
        titleKey: `items.${Key}.title`
        Icon: ComponentType<IconProps>
    }
}[WhyChooseUsItemId]

export const whyChooseUs: WhyChooseUsItem[] = [
    {
        id: 'relationships',
        labelKey: 'items.relationships.label',
        titleKey: 'items.relationships.title',
        Icon: HelpIcon,
    },
    {
        id: 'specialists',
        labelKey: 'items.specialists.label',
        titleKey: 'items.specialists.title',
        Icon: SearchSpecialistIcon,
    },
    {
        id: 'space',
        labelKey: 'items.space.label',
        titleKey: 'items.space.title',
        Icon: CreateIcon,
    },
    {
        id: 'learning',
        labelKey: 'items.learning.label',
        titleKey: 'items.learning.title',
        Icon: LearnIcon,
    },
    {
        id: 'support',
        labelKey: 'items.support.label',
        titleKey: 'items.support.title',
        Icon: SupportIcon,
    },
    {
        id: 'balance',
        labelKey: 'items.balance.label',
        titleKey: 'items.balance.title',
        Icon: BalanceIcon,
    },
]
