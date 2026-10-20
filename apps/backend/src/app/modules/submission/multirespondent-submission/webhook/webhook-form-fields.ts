import type { FormFieldMeta } from '@opengovsg/formsg-sdk'
import { BasicField, FormFieldDto } from 'formsg-shared/types'

import { FormFieldSchema } from 'src/types/field'

/** Original question titles from the saved form definition. */
export const buildWebhookFormFields = (
  fields: (FormFieldDto | FormFieldSchema)[],
): Record<string, Pick<FormFieldMeta, 'question' | 'subFields'>> =>
  Object.fromEntries(
    fields.map((field) => [
      String(field._id),
      {
        question: field.title,
        ...(field.fieldType === BasicField.Table && {
          subFields: Object.fromEntries(
            field.columns.map((column) => [
              String(column._id),
              { question: column.title },
            ]),
          ),
        }),
      },
    ]),
  )
