import { useFormState } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'

import FormLabel from '~components/FormControl/FormLabel'

import { TableFieldSchema } from '../types'

export type BaseTableFieldProps = {
  schema: TableFieldSchema
}

export interface TableFieldContainerProps extends BaseTableFieldProps {
  children: React.ReactNode
}

/**
 * Field container layout that all rendered form fields share.
 * @precondition There must be a parent `react-hook-form#FormProvider` component as this component relies on methods the FormProvider component provides.
 */
export const TableFieldContainer = ({
  schema,
  children,
}: TableFieldContainerProps): JSX.Element => {
  const { isSubmitting, isValid, errors } = useFormState({ name: schema._id })

  return (
    <FormControl
      id={schema._id}
      isRequired={schema.required}
      isDisabled={schema.disabled}
      isReadOnly={isValid && isSubmitting}
      isInvalid={!!errors[schema._id]}
    >
      <FormLabel
        questionNumber={
          schema.questionNumber ? `${schema.questionNumber}.` : undefined
        }
        description={schema.description}
      >
        {schema.title}
      </FormLabel>
      {children}
    </FormControl>
  )
}
