import { useMemo } from 'react'
import { useFormContext, useFormState, useWatch } from 'react-hook-form'
import { FormControl, useMultiStyleConfig } from '@chakra-ui/react'
import { get } from 'lodash'

import { CheckboxFieldBase, FormFieldWithId } from '~shared/types/field'

import { CHECKBOX_THEME_KEY } from '~theme/components/Checkbox'
import { createCheckboxValidationRules } from '~utils/fieldValidation'
import Checkbox from '~components/Checkbox'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'

export const CHECKBOX_OTHERS_INPUT_KEY = 'others-input'
export const CHECKBOX_OTHERS_INPUT_VALUE =
  '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'

export type CheckboxFieldSchema = FormFieldWithId<CheckboxFieldBase>
export interface CheckboxFieldProps extends BaseFieldProps {
  schema: CheckboxFieldSchema
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const CheckboxField = ({
  schema,
  questionNumber,
}: CheckboxFieldProps): JSX.Element => {
  const styles = useMultiStyleConfig(CHECKBOX_THEME_KEY, {})

  const othersInputName = useMemo(
    () => `${schema._id}.${CHECKBOX_OTHERS_INPUT_KEY}`,
    [schema._id],
  )
  const checkboxInputName = `${schema._id}.value`

  const validationRules = useMemo(() => {
    return {
      ...createCheckboxValidationRules(schema),
      deps: [othersInputName],
    }
  }, [othersInputName, schema])

  const { register, control } = useFormContext()
  const { isValid, isSubmitting, errors } = useFormState({ name: schema._id })

  const checkboxValues = useWatch({
    name: checkboxInputName,
    defaultValue: [],
    control,
  })
  const isOthersSelected = useMemo(
    () =>
      Array.isArray(checkboxValues) &&
      checkboxValues.includes(CHECKBOX_OTHERS_INPUT_VALUE),
    [checkboxValues],
  )

  const othersValidationRules = useMemo(
    () => ({
      validate: (value: string) => {
        return (
          !isOthersSelected ||
          !!value ||
          'Please specify a value for the "others" option'
        )
      },
    }),
    [isOthersSelected],
  )

  return (
    <FieldContainer
      schema={schema}
      questionNumber={questionNumber}
      errorKey={checkboxInputName}
    >
      {schema.fieldOptions.map((o, idx) => (
        <Checkbox
          key={idx}
          value={o}
          {...register(checkboxInputName, validationRules)}
        >
          {o}
        </Checkbox>
      ))}
      {schema.othersRadioButton ? (
        <Checkbox.OthersWrapper>
          <FormControl
            isRequired={schema.required}
            isDisabled={schema.disabled}
            isReadOnly={isValid && isSubmitting}
            isInvalid={!!get(errors, othersInputName)}
          >
            <Checkbox.OthersCheckbox
              value={CHECKBOX_OTHERS_INPUT_VALUE}
              {...register(checkboxInputName, validationRules)}
            />
            <Checkbox.OthersInput
              aria-label='Enter value for "Others" option'
              {...register(othersInputName, othersValidationRules)}
            />
            <FormErrorMessage ml={styles.othersInput?.ml as string} mb={0}>
              {get(errors, `${othersInputName}.message`)}
            </FormErrorMessage>
          </FormControl>
        </Checkbox.OthersWrapper>
      ) : null}
    </FieldContainer>
  )
}
