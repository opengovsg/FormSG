import React from 'react'
import { Flex, Text } from '@chakra-ui/react'

import { FormStartPage, Language } from '~shared/types'

import { TranslationContainer } from './TranslationContainer'

interface StartPageTranslationContainerProps {
  startPage?: FormStartPage
  capitalisedLanguage: string
  unicodeLocale: Language
}

export const StartPageTranslationContainer: React.FC<StartPageTranslationContainerProps> =
  React.memo(({ startPage, capitalisedLanguage, unicodeLocale }) => {
    if (!startPage) return null

    const currentTranslations = startPage.paragraphTranslations ?? []
    const previousTranslation =
      currentTranslations.find(
        (translation) => translation.language === unicodeLocale,
      )?.translation ?? ''

    return (
      <Flex justifyContent="flex-start" mb="2.5rem" direction="column">
        <Text
          color="secondary.500"
          fontSize="1.25rem"
          fontWeight="600"
          mb="1rem"
        >
          Question
        </Text>
        <TranslationContainer
          language={capitalisedLanguage}
          defaultString={startPage.paragraph}
          editingTranslation="paragraphTranslations"
          previousTranslation={previousTranslation}
        />
      </Flex>
    )
  })
