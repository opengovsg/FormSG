/**
 * Field container layout that all rendered form fields share.
 */

import { useFormContext } from 'react-hook-form'
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
    formState: { errors, isSubmitting },
  } = useFormContext()
  const { _id: name } = schema

  return (
    <FormControl
      isRequired={schema.required}
      isDisabled={schema.disabled}
      isReadOnly={isSubmitting}
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
      <FormErrorMessage>
        {errors[name] && errors[name].message}
      </FormErrorMessage>
    </FormControl>
  )
}
