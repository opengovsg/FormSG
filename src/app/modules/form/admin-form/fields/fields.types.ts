import { Result } from 'neverthrow'

import { IFieldSchema } from '../../../../../types'

import { EditFieldError } from './fields.errors'

export type EditFormFieldResult = Result<IFieldSchema[], EditFieldError>
