import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Flex, FormControl, Text, Textarea } from '@chakra-ui/react'

import {
  CheckboxFieldBase,
  DropdownFieldBase,
  Language,
  RadioFieldBase,
} from '~shared/types'

import { TranslationInput } from './TranslationSection'

interface OptionsTranslationContainerProps {
  language: string
  unicodeLocale: Language
  formFieldData: CheckboxFieldBase | DropdownFieldBase | RadioFieldBase
}

export const OptionsTranslationContainer = ({
  language,
  unicodeLocale,
  formFieldData,
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
    <Flex direction="column" width="100%">
      <Flex alignItems="center" mb="2rem">
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
        />
      </Flex>
      <Flex alignItems="center">
        <Text color="secondary.700" mr="7.5rem" width="6.25rem">
          {language}
        </Text>
        <FormControl>
          <Textarea
            width="100%"
            {...register('fieldOptionsTranslations')}
            defaultValue={previousTranslations}
          />
        </FormControl>
      </Flex>
    </Flex>
  )
}
