/**
 * Field container layout that all rendered form fields share.
 * @precondition There must be a parent `react-hook-form#FormProvider`
 * component as this component relies on methods the FormProvider component
 * provides.
 */
import { FieldError, useFormState } from 'react-hook-form'
import { Box, FormControl, Grid } from '@chakra-ui/react'
import { get } from 'lodash'

import { FormColorTheme, Language } from '~shared/types/form'

import Badge from '~components/Badge'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { FormFieldWithQuestionNo } from '~features/form/types'

export type BaseFieldProps = {
  schema: Pick<
    FormFieldWithQuestionNo,
    | '_id'
    | 'required'
    | 'description'
    | 'title'
    | 'disabled'
    | 'questionNumber'
    | 'titleTranslations'
    | 'descriptionTranslations'
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

  /**
   * Optional specification for error message variant.
   */
  errorVariant?: 'white'

  /**
   * Form language selected by user.
   */
  selectedLanguage?: Language
}

export interface FieldContainerProps extends BaseFieldProps {
  children: React.ReactNode
}

export const FieldContainer = ({
  schema,
  children,
  errorKey,
  showMyInfoBadge,
  errorVariant,
  selectedLanguage = Language.ENGLISH,
}: FieldContainerProps): JSX.Element => {
  const { errors, isSubmitting, isValid } = useFormState({ name: schema._id })

  const error: FieldError | undefined = get(errors, errorKey ?? schema._id)

  let title = schema.title

  const titleTranslations = schema.titleTranslations ?? []
  // check if there are any title translations for the selected language
  const titleTranslationIdx = titleTranslations.findIndex(
    (titleTranslation) => {
      return titleTranslation.language === selectedLanguage
    },
  )

  // If there are title translations for the selected language, use the translation.
  // If not default it to English.
  if (titleTranslationIdx !== -1) {
    title = titleTranslations[titleTranslationIdx].translation
  }

  let description = schema.description

  const descriptionTranslations = schema.descriptionTranslations ?? []
  // check if there are any description translations for the selected language
  const descriptionTranslationIdx = descriptionTranslations.findIndex(
    (descriptionTranslation) =>
      descriptionTranslation.language === selectedLanguage,
  )

  // If there are description translations for the language, use the translation.
  // If not default it to English.
  if (descriptionTranslationIdx !== -1) {
    description = descriptionTranslations[descriptionTranslationIdx].translation
  }

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
          description={description}
        >
          {title}
        </FormLabel>
        {showMyInfoBadge && (
          <Box gridArea="myinfobadge">
            <Badge variant="subtle" colorScheme="secondary">
              MyInfo
            </Badge>
          </Box>
        )}
      </Grid>
      {children}
      <FormErrorMessage variant={errorVariant}>
        {error?.message}
      </FormErrorMessage>
    </FormControl>
  )
}
