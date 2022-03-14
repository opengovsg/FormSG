import { useMemo } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { FormControl, useMultiStyleConfig } from '@chakra-ui/react'
import { get } from 'lodash'

import { FormFieldWithId, RadioFieldBase } from '~shared/types/field'

import { RADIO_THEME_KEY } from '~theme/components/Radio'
import { createRadioValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Radio, { OthersInput } from '~components/Radio'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'

export const RADIO_OTHERS_INPUT_KEY = 'others-input'
export const RADIO_OTHERS_INPUT_VALUE = '!!FORMSG_INTERNAL_RADIO_OTHERS_VALUE!!'

export type RadioFieldSchema = FormFieldWithId<RadioFieldBase>
export interface RadioFieldProps extends BaseFieldProps {
  schema: RadioFieldSchema
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const RadioField = ({
  schema,
  questionNumber,
}: RadioFieldProps): JSX.Element => {
  const styles = useMultiStyleConfig(RADIO_THEME_KEY, {})

  const othersInputName = useMemo(
    () => `${schema._id}.${RADIO_OTHERS_INPUT_KEY}`,
    [schema._id],
  )
  const radioInputName = `${schema._id}.value`

  const validationRules = useMemo(() => {
    return {
      ...createRadioValidationRules(schema),
      deps: [othersInputName],
    }
  }, [othersInputName, schema])

  const {
    register,
    control,
    formState: { isValid, isSubmitting, errors },
  } = useFormContext()
  const radioValue = useWatch({ name: radioInputName, control })

  const isOthersSelected = useMemo(
    () => schema.othersRadioButton && radioValue === RADIO_OTHERS_INPUT_VALUE,
    [radioValue, schema.othersRadioButton],
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
      errorKey={radioInputName}
    >
      <Controller
        name={radioInputName}
        rules={validationRules}
        // `ref` omitted so the radiogroup will not have a ref and only the
        // radio themselves get the ref.
        render={({ field: { ref, ...rest } }) => (
          <Radio.RadioGroup {...rest}>
            {schema.fieldOptions.map((option, idx) => (
              <Radio key={idx} value={option} {...(idx === 0 ? { ref } : {})}>
                {option}
              </Radio>
            ))}
            {schema.othersRadioButton ? (
              <Radio.OthersWrapper value={RADIO_OTHERS_INPUT_VALUE}>
                <FormControl
                  isRequired={schema.required}
                  isDisabled={schema.disabled}
                  isReadOnly={isValid && isSubmitting}
                  isInvalid={!!get(errors, othersInputName)}
                >
                  <OthersInput
                    aria-label='Enter value for "Others" option'
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
