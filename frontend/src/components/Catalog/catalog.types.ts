import type { GetPsychologistsParams } from '../../types/psychologist'

export type CatalogQuery = Omit<GetPsychologistsParams, 'limit' | 'offset'>
