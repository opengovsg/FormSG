import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Flex, FormControl, Input, Text, Textarea } from '@chakra-ui/react'

import { TranslationInput } from './TranslationSection'

interface TranslationContainerProps {
  language: string
  defaultString: string | undefined
  editingTranslation: keyof TranslationInput
  previousTranslation?: string
}

export const TranslationContainer: React.FC<TranslationContainerProps> =
  React.memo(
    ({ language, defaultString, editingTranslation, previousTranslation }) => {
      const { register } = useFormContext<TranslationInput>()

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
              placeholder={defaultString}
              width="100%"
              isDisabled={true}
              padding="0.75rem"
              resize="none"
            />
          </Flex>
          <Flex alignItems="center">
            <Text color="secondary.700" mr="7.5rem" width="6.25rem">
              {language}
            </Text>
            <FormControl>
              <Input
                type="text"
                width="100%"
                {...register(editingTranslation)}
                defaultValue={previousTranslation}
              />
            </FormControl>
          </Flex>
        </Flex>
      )
    },
  )
