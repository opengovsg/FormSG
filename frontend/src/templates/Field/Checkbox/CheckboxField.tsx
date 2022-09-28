import { forwardRef, useMemo } from 'react'
import {
  get,
  useFormContext,
  UseFormRegisterReturn,
  useFormState,
} from 'react-hook-form'
import { Box, FormControl, useMultiStyleConfig } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

import { CHECKBOX_THEME_KEY } from '~theme/components/Checkbox'
import { createCheckboxValidationRules } from '~utils/fieldValidation'
import Checkbox from '~components/Checkbox'
import { CheckboxProps } from '~components/Checkbox/Checkbox'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { CheckboxFieldInputs, CheckboxFieldSchema } from '../types'

export const CHECKBOX_OTHERS_INPUT_KEY = 'othersInput'
export const CHECKBOX_OTHERS_INPUT_VALUE =
  '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'

export interface CheckboxFieldProps extends BaseFieldProps {
  schema: CheckboxFieldSchema
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const CheckboxField = ({
  schema,
  colorTheme = FormColorTheme.Blue,
}: CheckboxFieldProps): JSX.Element => {
  const fieldColorScheme = useMemo(
    () => `theme-${colorTheme}` as const,
    [colorTheme],
  )
  const styles = useMultiStyleConfig(CHECKBOX_THEME_KEY, {
    colorScheme: fieldColorScheme,
  })

  const othersInputName = useMemo(
    () => `${schema._id}.${CHECKBOX_OTHERS_INPUT_KEY}` as const,
    [schema._id],
  )
  const checkboxInputName = useMemo(
    () => `${schema._id}.value` as const,
    [schema._id],
  )

  const validationRules = useMemo(
    () => createCheckboxValidationRules(schema),
    [schema],
  )

  const { register, getValues } = useFormContext<CheckboxFieldInputs>()
  const { isValid, isSubmitting, errors } = useFormState<CheckboxFieldInputs>({
    name: schema._id,
  })

  const othersValidationRules = useMemo(
    () => ({
      validate: (value?: string) => {
        const currCheckedVals = getValues(checkboxInputName)
        return (
          !(
            Array.isArray(currCheckedVals) &&
            currCheckedVals.includes(CHECKBOX_OTHERS_INPUT_VALUE)
          ) ||
          !!value ||
          'Please specify a value for the "others" option'
        )
      },
    }),
    [checkboxInputName, getValues],
  )

  return (
    <FieldContainer schema={schema} errorKey={checkboxInputName}>
      <Box aria-label={schema.title} role="list">
        {schema.fieldOptions.map((o, idx) => (
          <Checkbox
            colorScheme={fieldColorScheme}
            key={idx}
            value={o}
            defaultValue=""
            aria-label={o}
            {...register(checkboxInputName, validationRules)}
          >
            {o}
          </Checkbox>
        ))}
        {schema.fieldOptions.length === 1 ? (
          // React-hook-form quirk where the value will not be set in an array if there is only a single checkbox option.
          // This is a workaround to set the value in an array by registering a hidden checkbox with the same id.
          // See https://github.com/react-hook-form/react-hook-form/issues/7834#issuecomment-1040735711.
          <input
            type="checkbox"
            hidden
            value=""
            {...register(checkboxInputName)}
          />
        ) : null}
        {schema.othersRadioButton ? (
          <Checkbox.OthersWrapper colorScheme={fieldColorScheme}>
            <FormControl
              isRequired={schema.required}
              isDisabled={schema.disabled}
              isReadOnly={isValid && isSubmitting}
              isInvalid={!!get(errors, othersInputName)}
            >
              <OtherCheckboxField
                colorScheme={fieldColorScheme}
                value={CHECKBOX_OTHERS_INPUT_VALUE}
                isInvalid={!!get(errors, checkboxInputName)}
                {...register(checkboxInputName, validationRules)}
              />
              <Checkbox.OthersInput
                colorScheme={fieldColorScheme}
                aria-label='"Other" response'
                {...register(othersInputName, othersValidationRules)}
              />
              <FormErrorMessage ml={styles.othersInput?.ml as string} mb={0}>
                {get(errors, `${othersInputName}.message`)}
              </FormErrorMessage>
            </FormControl>
          </Checkbox.OthersWrapper>
        ) : null}
      </Box>
    </FieldContainer>
  )
}

interface OtherCheckboxFieldProps
  extends UseFormRegisterReturn,
    Omit<CheckboxProps, keyof UseFormRegisterReturn> {
  value: string
}
const OtherCheckboxField = forwardRef<
  HTMLInputElement,
  OtherCheckboxFieldProps
>((props, ref) => <Checkbox.OthersCheckbox {...props} ref={ref} />)
