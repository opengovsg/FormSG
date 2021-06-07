import { LeanDocument } from 'mongoose'

import { IFieldSchema } from '../field'

export interface IPossiblyPrefilledField extends LeanDocument<IFieldSchema> {
  fieldValue?: string
}
