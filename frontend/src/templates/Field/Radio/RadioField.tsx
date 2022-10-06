import { useMemo } from 'react'
import { Controller, useFormContext, useFormState } from 'react-hook-form'
import { FormControl, useMultiStyleConfig } from '@chakra-ui/react'
import { get } from 'lodash'

import { FormColorTheme } from '~shared/types'

import { RADIO_THEME_KEY } from '~theme/components/Radio'
import { createRadioValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Radio, { OthersInput } from '~components/Radio'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { RadioFieldInputs, RadioFieldSchema } from '../types'

export const RADIO_OTHERS_INPUT_KEY = 'othersInput'
export const RADIO_OTHERS_INPUT_VALUE = '!!FORMSG_INTERNAL_RADIO_OTHERS_VALUE!!'

export interface RadioFieldProps extends BaseFieldProps {
  schema: RadioFieldSchema
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const RadioField = ({
  schema,
  colorTheme = FormColorTheme.Blue,
}: RadioFieldProps): JSX.Element => {
  const fieldColorScheme = useMemo(
    () => `theme-${colorTheme}` as const,
    [colorTheme],
  )
  const styles = useMultiStyleConfig(RADIO_THEME_KEY, {
    colorScheme: fieldColorScheme,
  })

  const othersInputName = useMemo(
    () => `${schema._id}.${RADIO_OTHERS_INPUT_KEY}` as const,
    [schema._id],
  )
  const radioInputName = useMemo(
    () => `${schema._id}.value` as const,
    [schema._id],
  )

  const validationRules = useMemo(
    () => createRadioValidationRules(schema),
    [schema],
  )

  const { register, getValues, trigger } = useFormContext<RadioFieldInputs>()
  const { isValid, isSubmitting, errors } = useFormState<RadioFieldInputs>({
    name: schema._id,
  })

  const othersValidationRules = useMemo(
    () => ({
      validate: (value?: string) => {
        return (
          !schema.othersRadioButton ||
          !(getValues(radioInputName) === RADIO_OTHERS_INPUT_VALUE) ||
          !!value ||
          'Please specify a value for the "others" option'
        )
      },
    }),
    [getValues, radioInputName, schema.othersRadioButton],
  )

  return (
    <FieldContainer schema={schema} errorKey={radioInputName}>
      <Controller
        name={radioInputName}
        rules={validationRules}
        defaultValue=""
        // `ref` omitted so the radiogroup will not have a ref and only the
        // radio themselves get the ref.
        render={({ field: { ref, onChange, value, ...rest } }) => (
          <Radio.RadioGroup
            colorScheme={fieldColorScheme}
            {...rest}
            value={value}
            onChange={(nextValue) => {
              onChange(nextValue)
              // Trigger validation of others input if Other radio is selected.
              if (value === RADIO_OTHERS_INPUT_VALUE) trigger(othersInputName)
            }}
            aria-label={schema.title}
            aria-invalid={
              !!get(errors, radioInputName) || !!get(errors, othersInputName)
            }
            aria-required={schema.required}
          >
            {schema.fieldOptions.map((option, idx) => (
              <Radio
                key={idx}
                value={option}
                {...(idx === 0 ? { ref } : {})}
                // Required should apply to radio group rather than individual radio.
                isRequired={false}
              >
                {option}
              </Radio>
            ))}
            {schema.othersRadioButton ? (
              <Radio.OthersWrapper
                colorScheme={fieldColorScheme}
                value={RADIO_OTHERS_INPUT_VALUE}
              >
                <FormControl
                  isRequired={schema.required}
                  isDisabled={schema.disabled}
                  isReadOnly={isValid && isSubmitting}
                  isInvalid={!!get(errors, othersInputName)}
                >
                  <OthersInput
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
              </Radio.OthersWrapper>
            ) : null}
          </Radio.RadioGroup>
        )}
      />
    </FieldContainer>
  )
}
