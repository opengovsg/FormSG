import { FlattenMaps } from 'mongoose'

import { FormFieldSchema } from '../field'

export type PossiblyPrefilledField = FlattenMaps<FormFieldSchema> & {
  fieldValue?: string
}
