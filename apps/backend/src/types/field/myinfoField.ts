import { FlattenMaps } from 'mongoose'

import { FormFieldSchema } from '.'

export type PossiblyPrefilledField = FlattenMaps<FormFieldSchema> & {
  fieldValue?: string
}
