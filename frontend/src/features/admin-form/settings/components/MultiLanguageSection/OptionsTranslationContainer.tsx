import { FieldError, useFormContext } from 'react-hook-form'
import { Flex, FormControl, Text } from '@chakra-ui/react'

import {
  CheckboxFieldBase,
  DropdownFieldBase,
  Language,
  RadioFieldBase,
} from '~shared/types'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Textarea from '~components/Textarea'

import { TranslationInput } from './TranslationSection'

interface OptionsTranslationContainerProps {
  language: string
  unicodeLocale: Language
  formFieldData: CheckboxFieldBase | DropdownFieldBase | RadioFieldBase
  errors?: FieldError
}

export const OptionsTranslationContainer = ({
  language,
  unicodeLocale,
  formFieldData,
  errors,
}: OptionsTranslationContainerProps) => {
  const { register } = useFormContext<TranslationInput>()

  const fieldOptions = formFieldData.fieldOptions || []
  const defaultFieldOptions = fieldOptions.join('\n')
  const fieldOptionsTranslations = formFieldData.fieldOptionsTranslations || []

  const previousTranslations =
    fieldOptionsTranslations
      .find((translation) => translation.language === unicodeLocale)
      ?.translation.join('\n') || []

  return (
    <Flex direction="column" width="100%" mb="2.5rem">
      <Flex alignItems="flex-start" mb="2rem">
        <Text
          color="secondary.700"
          fontWeight="400"
          mr="7.5rem"
          width="6.25rem"
        >
          Default
        </Text>
        <Textarea
          placeholder={defaultFieldOptions}
          width="100%"
          isDisabled={true}
          padding="0.75rem"
          resize="none"
          height="max-content"
          overflow="hidden"
        />
      </Flex>
      <Flex alignItems="flex-start">
        <Text color="secondary.700" mr="7.5rem" width="6.25rem">
          {language}
        </Text>
        <FormControl isInvalid={!!errors}>
          <Textarea
            width="100%"
            {...register('fieldOptionsTranslations')}
            defaultValue={previousTranslations}
          />
          <FormErrorMessage>{errors?.message}</FormErrorMessage>
        </FormControl>
      </Flex>
    </Flex>
  )
}
