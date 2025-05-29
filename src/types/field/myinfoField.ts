import { FormField } from 'shared/types'

export type PossiblyPrefilledField = FormField & {
  fieldValue?: string
}
