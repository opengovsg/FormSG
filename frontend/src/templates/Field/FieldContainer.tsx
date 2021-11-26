/**
 * Field container layout that all rendered form fields share.
 * @precondition There must be a parent `react-hook-form#FormProvider`
 * component as this component relies on methods the FormProvider component
 * provides.
 */
import { FieldError, useFormContext } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'
import { get } from 'lodash'

import { FormFieldWithId } from '~shared/types/field'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import { FormLabelProps } from '~components/FormControl/FormLabel/FormLabel'

export type BaseFieldProps = {
  schema: FormFieldWithId
  questionNumber?: FormLabelProps['questionNumber']
  /**
   * Optional key of error to display in form error message.
   * If not provided, will default to given `schema._id`.
   */
  errorKey?: string
}

export interface FieldContainerProps extends BaseFieldProps {
  children: React.ReactNode
}

export const FieldContainer = ({
  schema,
  questionNumber,
  children,
  errorKey,
}: FieldContainerProps): JSX.Element => {
  const {
    formState: { errors, isSubmitting, isValid },
  } = useFormContext()

  const error: FieldError | undefined = get(errors, errorKey ?? schema._id)

  return (
    <FormControl
      isRequired={schema.required}
      isDisabled={schema.disabled}
      isReadOnly={isValid && isSubmitting}
      isInvalid={!!error}
      mb={6}
    >
      <FormLabel
        questionNumber={questionNumber}
        description={schema.description}
      >
        {schema.title}
      </FormLabel>
      {children}
      <FormErrorMessage>{error?.message}</FormErrorMessage>
    </FormControl>
  )
}
