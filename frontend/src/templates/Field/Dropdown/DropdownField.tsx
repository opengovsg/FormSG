import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { DropdownFieldBase, FormFieldWithId } from '~shared/types/field'

import { createDropdownValidationRules } from '~utils/fieldValidation'
import { SingleSelect } from '~components/Dropdown/SingleSelect'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { SingleAnswerFieldInput } from '../types'

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

  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema} questionNumber={questionNumber}>
      <Controller
        control={control}
        rules={validationRules}
        name={schema._id}
        defaultValue=""
        render={({ field }) => (
          <SingleSelect items={schema.fieldOptions} {...field} />
        )}
      />
    </FieldContainer>
  )
}
