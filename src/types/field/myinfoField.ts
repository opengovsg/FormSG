import { LeanDocument } from 'mongoose'

import { FormFieldSchema } from '../field'

export type PossiblyPrefilledField = LeanDocument<FormFieldSchema> & {
  fieldValue?: string
}
