import { Stack } from '@chakra-ui/react'

import { FormFieldDto } from 'formsg-shared/types'

import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'
import { augmentFieldWithQuestionNo } from '~features/form/utils'

/**
 * Login fields a deletion removes, shown as the same numbered badges as the
 * Settings login switch, so admins can tell apart fields with the same title.
 */
export const DeletedAuthFields = ({
  fields,
  formFields,
}: {
  fields: readonly Pick<FormFieldDto, '_id'>[]
  formFields: readonly FormFieldDto[]
}): JSX.Element => {
  const numberedFields = new Map(
    augmentFieldWithQuestionNo([...formFields]).map((field) => [
      field._id,
      field,
    ]),
  )
  return (
    <Stack spacing="0.5rem" align="flex-start">
      {fields.map((field) => (
        <FieldLogicBadge
          key={field._id}
          field={numberedFields.get(field._id)}
        />
      ))}
    </Stack>
  )
}
