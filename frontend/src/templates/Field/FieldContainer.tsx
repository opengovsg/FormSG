/**
 * Field container layout that all rendered form fields share.
 * @precondition There must be a parent `react-hook-form#FormProvider`
 * component as this component relies on methods the FormProvider component
 * provides.
 */
import { FieldError, useFormState } from 'react-hook-form'
import { Box, FormControl, Grid } from '@chakra-ui/react'
import { get } from 'lodash'

import { FormColorTheme } from '~shared/types/form'

import Badge from '~components/Badge'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { FormFieldWithQuestionNo } from '~features/form/types'

export type BaseFieldProps = {
  schema: Pick<
    FormFieldWithQuestionNo,
    '_id' | 'required' | 'description' | 'title' | 'disabled' | 'questionNumber'
  >
  /**
   * Color theme of form, if available. Defaults to `FormColorTheme.Blue`
   */
  colorTheme?: FormColorTheme
  /**
   * Optional key of error to display in form error message.
   * If not provided, will default to given `schema._id`.
   */
  errorKey?: string

  /**
   * Whether or not the field was prefilled.
   */
  isPrefilled?: boolean

  /**
   * Whether the MyInfo badge should be shown next to the question name.
   */
  showMyInfoBadge?: boolean
}

export interface FieldContainerProps extends BaseFieldProps {
  children: React.ReactNode
}

export const FieldContainer = ({
  schema,
  children,
  errorKey,
  showMyInfoBadge,
}: FieldContainerProps): JSX.Element => {
  const { errors, isSubmitting, isValid } = useFormState({ name: schema._id })

  const error: FieldError | undefined = get(errors, errorKey ?? schema._id)

  return (
    <FormControl
      isRequired={schema.required}
      isDisabled={schema.disabled}
      isReadOnly={isValid && isSubmitting}
      isInvalid={!!error}
      id={schema._id}
    >
      <Grid
        gridTemplateAreas={"'formlabel myinfobadge'"}
        gridTemplateColumns={'1fr auto'}
      >
        <FormLabel
          useMarkdownForDescription
          gridArea="formlabel"
          questionNumber={
            schema.questionNumber ? `${schema.questionNumber}.` : undefined
          }
          description={schema.description}
        >
          {schema.title}
        </FormLabel>
        <Box hidden={!showMyInfoBadge} gridArea="myinfobadge">
          <Badge variant="subtle" colorScheme="secondary">
            MyInfo
          </Badge>
        </Box>
      </Grid>
      {children}
      <FormErrorMessage>{error?.message}</FormErrorMessage>
    </FormControl>
  )
}
