import type { FormFieldMeta } from '@opengovsg/formsg-sdk'
import { FormFieldDto } from 'formsg-shared/types'

import { FormFieldSchema } from 'src/types/field'

/** Original question titles from the saved form definition. */
export const buildWebhookFormFields = (
  fields: (FormFieldDto | FormFieldSchema)[],
): Record<string, Pick<FormFieldMeta, 'question'>> =>
  Object.fromEntries(
    fields.map((field) => [String(field._id), { question: field.title }]),
  )
