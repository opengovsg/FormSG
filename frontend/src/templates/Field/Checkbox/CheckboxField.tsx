import { forwardRef, useMemo } from 'react'
import { Controller, get, useFormContext, useFormState } from 'react-hook-form'
import {
  Box,
  CheckboxGroup as ChakraCheckboxGroup,
  CheckboxGroupProps as ChakraCheckboxGroupProps,
  FormControl,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

import { CHECKBOX_THEME_KEY } from '~theme/components/Checkbox'
import { createCheckboxValidationRules } from '~utils/fieldValidation'
import Checkbox from '~components/Checkbox'
import { CheckboxProps } from '~components/Checkbox/Checkbox'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { CheckboxFieldInputs, CheckboxFieldSchema } from '../types'

import {
  CHECKBOX_OTHERS_INPUT_KEY,
  CHECKBOX_OTHERS_INPUT_VALUE,
} from './constants'

export interface CheckboxFieldProps extends BaseFieldProps {
  schema: CheckboxFieldSchema
  disableRequiredValidation?: boolean
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const CheckboxField = ({
  schema,
  disableRequiredValidation,
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
    () => createCheckboxValidationRules(schema, disableRequiredValidation),
    [disableRequiredValidation, schema],
  )

  const { register, getValues, control } = useFormContext<CheckboxFieldInputs>()
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
      <Box aria-label={`${schema.questionNumber}. ${schema.title}`} role="list">
        <Controller
          name={checkboxInputName}
          control={control}
          rules={validationRules}
          render={({ field: { ref, ...field } }) => (
            <CheckboxGroup {...field}>
              {schema.fieldOptions.map((o, idx) => (
                <Checkbox
                  name={checkboxInputName}
                  colorScheme={fieldColorScheme}
                  key={idx}
                  value={o}
                  aria-label={o}
                  {...(idx === 0 ? { ref } : {})}
                >
                  {o}
                </Checkbox>
              ))}
              {schema.fieldOptions.length === 1 ? (
                // React-hook-form quirk where the value will not be set in an array if there is only a single checkbox option.
                // This is a workaround to set the value in an array by registering a hidden checkbox with the same id.
                // See https://github.com/react-hook-form/react-hook-form/issues/7834#issuecomment-1040735711.
                <input type="checkbox" hidden value="" />
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
                      name={checkboxInputName}
                      colorScheme={fieldColorScheme}
                      value={CHECKBOX_OTHERS_INPUT_VALUE}
                      isInvalid={!!get(errors, checkboxInputName)}
                    />
                    <Checkbox.OthersInput
                      colorScheme={fieldColorScheme}
                      aria-label='"Other" response'
                      {...register(othersInputName, othersValidationRules)}
                    />
                    <FormErrorMessage
                      ml={styles.othersInput?.ml as string}
                      mb={0}
                    >
                      {get(errors, `${othersInputName}.message`)}
                    </FormErrorMessage>
                  </FormControl>
                </Checkbox.OthersWrapper>
              ) : null}
            </CheckboxGroup>
          )}
        />
      </Box>
    </FieldContainer>
  )
}

interface CheckboxGroupProps extends Omit<ChakraCheckboxGroupProps, 'value'> {
  value: false | string[]
}
const CheckboxGroup = ({ children, value, ...props }: CheckboxGroupProps) => (
  <ChakraCheckboxGroup {...props} value={!value ? undefined : value}>
    {children}
  </ChakraCheckboxGroup>
)

interface OtherCheckboxFieldProps extends CheckboxProps {
  value: string
}
const OtherCheckboxField = forwardRef<
  HTMLInputElement,
  OtherCheckboxFieldProps
>((props, ref) => <Checkbox.OthersCheckbox {...props} ref={ref} />)
