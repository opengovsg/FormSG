/**
 * Field container layout that all rendered form fields share.
 * @precondition There must be a parent `react-hook-form#FormProvider`
 * component as this component relies on methods the FormProvider component
 * provides.
 */

import { FieldError, useFormContext } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'

import { FormFieldWithId } from '~shared/types/field'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import { FormLabelProps } from '~components/FormControl/FormLabel/FormLabel'

export type BaseFieldProps = {
  schema: FormFieldWithId
  questionNumber?: FormLabelProps['questionNumber']
}

export interface FieldContainerProps extends BaseFieldProps {
  children: React.ReactNode
}

export const FieldContainer = ({
  schema,
  questionNumber,
  children,
}: FieldContainerProps): JSX.Element => {
  const {
    formState: { errors, isSubmitting, isValid },
  } = useFormContext()
  const { _id: name } = schema

  const getErrorMessage = () => {
    if (!errors[name]) return
    if (typeof errors[name]?.message === 'string') {
      return errors[name]?.message
    }

    const [firstError] = Object.values(errors[name]) as FieldError[]
    return firstError?.message
  }

  return (
    <FormControl
      isRequired={schema.required}
      isDisabled={schema.disabled}
      isReadOnly={isValid && isSubmitting}
      isInvalid={!!errors[name]}
      mb={6}
    >
      <FormLabel
        questionNumber={questionNumber}
        description={schema.description}
      >
        {schema.title}
      </FormLabel>
      {children}
      <FormErrorMessage>{getErrorMessage()}</FormErrorMessage>
    </FormControl>
  )
}
