import { useMemo } from 'react'
import { Controller } from 'react-hook-form'

import { DropdownFieldBase, FormFieldWithId } from '~shared/types/field'

import { createDropdownValidationRules } from '~utils/fieldValidation'
import { SingleSelect } from '~components/Dropdown/SingleSelect'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'

export type DropdownFieldSchema = FormFieldWithId<DropdownFieldBase>
export interface DropdownFieldProps extends BaseFieldProps {
  schema: DropdownFieldSchema
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const DropdownField = ({
  schema,
  questionNumber,
}: DropdownFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createDropdownValidationRules(schema),
    [schema],
  )

  return (
    <FieldContainer schema={schema} questionNumber={questionNumber}>
      <Controller
        rules={validationRules}
        name={schema._id}
        render={({ field }) => (
          <SingleSelect items={schema.fieldOptions} {...field} />
        )}
      />
    </FieldContainer>
  )
}
