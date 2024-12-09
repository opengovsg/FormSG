import { useFormContext } from 'react-hook-form'
import { Flex, FormControl, Text } from '@chakra-ui/react'

import Textarea from '~components/Textarea'

import { TranslationInput } from './TranslationSection'

interface TranslationContainerProps {
  language: string
  defaultString: string | undefined
  editingTranslation: keyof TranslationInput
  previousTranslation?: string
}

export const TranslationContainer = ({
  language,
  defaultString,
  editingTranslation,
  previousTranslation,
}: TranslationContainerProps) => {
  const { register } = useFormContext<TranslationInput>()

  return (
    <Flex direction="column" width="100%">
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
          placeholder={defaultString}
          width="100%"
          isDisabled={true}
          resize="none"
        />
      </Flex>
      <Flex alignItems="flex-start">
        <Text color="secondary.700" mr="7.5rem" width="6.25rem">
          {language}
        </Text>
        <FormControl>
          <Textarea
            defaultValue={previousTranslation}
            {...register(editingTranslation)}
          />
        </FormControl>
      </Flex>
    </Flex>
  )
}
