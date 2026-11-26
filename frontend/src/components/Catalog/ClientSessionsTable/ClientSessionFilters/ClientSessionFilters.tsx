import { useTranslation } from 'react-i18next'

import type { ClientSessionsFilter } from '../../../../services/clientCabinetApi'
import { TagButton } from '../../../UI/Buttons'

import './ClientSessionFilters.scss'

const FILTERS = ['all', 'scheduled', 'completed', 'saved'] as const

type Props = {
    activeFilter: ClientSessionsFilter
    onChange: (filter: ClientSessionsFilter) => void
}

export const ClientSessionFilters = ({ activeFilter, onChange }: Props) => {
    const { t } = useTranslation('clientCabinet', { keyPrefix: 'sessionsTable' })

    return (
        <div className="client-sessions-table__filters" role="group" aria-label={t('filtersLabel')}>
            {FILTERS.map((filter) => (
                <TagButton
                    key={filter}
                    type="button"
                    variant="black"
                    isSelected={activeFilter === filter}
                    onClick={() => onChange(filter)}
                >
                    {t(`filters.${filter}`)}
                </TagButton>
            ))}
        </div>
    )
}
