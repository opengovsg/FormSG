/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Field container layout that all rendered form fields share.
 * @precondition There must be a parent `react-hook-form#FormProvider`
 * component as this component relies on methods the FormProvider component
 * provides.
 */

import { useMemo } from 'react'
import { get, useFormContext } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import { FormLabelProps } from '~components/FormControl/FormLabel/FormLabel'

import { TableFieldSchema } from './TableField'

export type BaseTableFieldProps = {
  schema: TableFieldSchema
  questionNumber?: FormLabelProps['questionNumber']
}

export interface TableFieldContainerProps extends BaseTableFieldProps {
  children: React.ReactNode
}

export const TableFieldContainer = ({
  schema,
  questionNumber,
  children,
}: TableFieldContainerProps): JSX.Element => {
  const {
    formState: { isSubmitting, isValid, errors },
  } = useFormContext()

  const getFirstErrorMessage = () => {
    const allErrors = schema.columns
      .map((c) => get(errors, `${schema._id}.${c._id}`))
      .filter(Boolean)
    console.log(allErrors)

    if (allErrors) {
      const firstValue = (Object.values(allErrors)?.pop() as Error[])?.pop()

      return firstValue?.message
    }

    return undefined
  }

  return (
    <FormControl
      isRequired={schema.required}
      isDisabled={schema.disabled}
      isReadOnly={isValid && isSubmitting}
      isInvalid={get(errors, schema._id)}
      mb={6}
    >
      <FormLabel
        questionNumber={questionNumber}
        description={schema.description}
      >
        {schema.title}
      </FormLabel>
      {children}
      <FormErrorMessage>{getFirstErrorMessage()}</FormErrorMessage>
    </FormControl>
  )
}
