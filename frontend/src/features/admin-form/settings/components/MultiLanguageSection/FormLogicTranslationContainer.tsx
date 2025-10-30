import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Divider, Flex, FormControl, Text } from '@chakra-ui/react'

import { Language, PreventSubmitLogicDto } from '~shared/types'

import Textarea from '~components/Textarea'

import { TranslationInput } from './TranslationSection'

interface TableTranslationContainerProps {
  language: string
  unicodeLocale: Language
  formLogics: PreventSubmitLogicDto[]
}

export const FormLogicTranslationContainer = ({
  language,
  unicodeLocale,
  formLogics,
}: TableTranslationContainerProps) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.multiLanguage',
  })
  const { register } = useFormContext<TranslationInput>()

  return (
    <>
      {formLogics.map((formLogic, index) => {
        const defaultPreventSubmitMessage = formLogic.preventSubmitMessage
        const previousPreventSubmissionMessage =
          formLogic.preventSubmitMessageTranslations?.find(
            (translationMapping) => {
              return translationMapping.language === unicodeLocale
            },
          )?.translation ?? ''

        return (
          <Flex
            key={index}
            justifyContent="flex-start"
            mb="2.5rem"
            direction="column"
          >
            <Text
              color="secondary.500"
              fontSize="1.25rem"
              fontWeight="600"
              mb="1rem"
            >
              {t('formLogic.disableSubmission')}
            </Text>
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
                  placeholder={defaultPreventSubmitMessage}
                  width="100%"
                  isDisabled={true}
                  padding="0.75rem"
                  resize="none"
                />
              </Flex>
              <Flex alignItems="flex-start">
                <Text color="secondary.700" mr="7.5rem" width="6.25rem">
                  {language}
                </Text>
                <FormControl>
                  <Textarea
                    defaultValue={previousPreventSubmissionMessage}
                    {...register(`preventSubmitMessageTranslations.${index}`)}
                  />
                </FormControl>
              </Flex>
            </Flex>
            {index !== formLogics.length - 1 && <Divider mt="2.5rem" />}
          </Flex>
        )
      })}
    </>
  )
}
