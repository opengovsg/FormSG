import { useEffect, useMemo } from 'react'
import { FieldError, useFormContext } from 'react-hook-form'
import {
  FormControl,
  useMultiStyleConfig,
  VisuallyHidden,
} from '@chakra-ui/react'
import { get } from 'lodash'

import { CheckboxFieldBase, FormFieldWithId } from '~shared/types/field'

import { CHECKBOX_THEME_KEY } from '~theme/components/Checkbox'
import { createCheckboxValidationRules } from '~utils/fieldValidation'
import Checkbox from '~components/Checkbox'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

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

  const validationRules = useMemo(
    () => createCheckboxValidationRules(schema),
    [schema],
  )

  const {
    watch,
    trigger,
    register,
    formState: { isValid, isSubmitting, errors },
  } = useFormContext()
  const checkboxValues = watch(checkboxInputName, [])
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

  useEffect(() => {
    // When unchecking others, manually trigger input validation. This is
    // to ensure that if you select then unselect Others, the form knows
    // that the text input is now optional.
    if (schema.othersRadioButton && !isOthersSelected) {
      trigger(othersInputName)
    }
  }, [
    othersInputName,
    checkboxValues,
    schema.othersRadioButton,
    trigger,
    isOthersSelected,
  ])

  const othersInputError: FieldError | undefined = get(errors, othersInputName)

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
            isInvalid={!!othersInputError}
          >
            <Checkbox.OthersCheckbox
              value={CHECKBOX_OTHERS_INPUT_VALUE}
              {...register(checkboxInputName, validationRules)}
            />
            <VisuallyHidden>
              <FormLabel id={`${schema._id}-others`}>
                Enter value for "Others" option
              </FormLabel>
            </VisuallyHidden>
            <Checkbox.OthersInput
              aria-labelledby={`${schema._id}-others`}
              {...register(othersInputName, othersValidationRules)}
            />
            <FormErrorMessage ml={styles.othersInput?.ml as string} mb={0}>
              {othersInputError?.message}
            </FormErrorMessage>
          </FormControl>
        </Checkbox.OthersWrapper>
      ) : null}
    </FieldContainer>
  )
}
