/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { Controller } from 'react-hook-form'

import { FormFieldWithId, MobileFieldBase } from '~shared/types/field'

import { createMobileValidationRules } from '~utils/fieldValidation'
import PhoneNumberInput from '~components/PhoneNumberInput'

import { BaseFieldProps } from '../FieldContainer'
import { VerifiableField, VerifiableFieldContext } from '../VerifiableField'

export type MobileFieldSchema = FormFieldWithId<MobileFieldBase>
export interface MobileFieldProps extends BaseFieldProps {
  schema: MobileFieldSchema
}

export const MobileField = ({
  schema,
  questionNumber,
}: MobileFieldProps): JSX.Element => {
  const mobileValidationRules = useMemo(
    () => createMobileValidationRules(schema),
    [schema],
  )

  return (
    <VerifiableField schema={schema} questionNumber={questionNumber}>
      <VerifiableFieldContext.Consumer>
        {(context) => {
          if (!context) {
            throw new Error(
              `VerifiableFieldContext.Consumer must be used within a VerifiableField component`,
            )
          }
          return (
            <Controller
              rules={mobileValidationRules}
              name={context.fieldValueName}
              render={({ field: { onChange, ...rest } }) => {
                return (
                  <PhoneNumberInput
                    {...rest}
                    isAllowInternational={schema.allowIntlNumbers}
                    onChange={context.handleInputChange(onChange)}
                  />
                )
              }}
            />
          )
        }}
      </VerifiableFieldContext.Consumer>
    </VerifiableField>
  )
}
