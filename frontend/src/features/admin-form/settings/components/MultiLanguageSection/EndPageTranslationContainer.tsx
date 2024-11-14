import React from 'react'
import { Divider, Flex, Text } from '@chakra-ui/react'

import { FormEndPage, Language } from '~shared/types'

import { TranslationContainer } from './TranslationContainer'

interface EndPageTranslationsContainerProps {
  endPage?: FormEndPage
  capitalisedLanguage: string
  unicodeLocale: Language
}

export const EndPageTranslationsContainer: React.FC<EndPageTranslationsContainerProps> =
  React.memo(({ endPage, capitalisedLanguage, unicodeLocale }) => {
    if (!endPage) return null

    const hasParagraph = endPage.paragraph && endPage.paragraph.trim() !== ''

    const currentTitleTranslations = endPage.titleTranslations ?? []
    const currentParagraphTranslations = endPage.paragraphTranslations ?? []

    const previousTitleTranslation =
      currentTitleTranslations.find(
        (translation) => translation.language === unicodeLocale,
      )?.translation ?? ''

    const previousParagraphTranslation =
      currentParagraphTranslations.find(
        (translation) => translation.language === unicodeLocale,
      )?.translation ?? ''

    return (
      <>
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
            defaultString={endPage.title}
            editingTranslation="titleTranslation"
            previousTranslation={previousTitleTranslation}
          />
        </Flex>
        <Divider mb="2.5rem" />
        {hasParagraph && (
          <Flex justifyContent="flex-start" mb="2.5rem" direction="column">
            <Text
              color="secondary.500"
              fontSize="1.25rem"
              fontWeight="600"
              mb="1rem"
            >
              Follow-up instructions
            </Text>
            <TranslationContainer
              language={capitalisedLanguage}
              defaultString={endPage.paragraph}
              editingTranslation="paragraphTranslations"
              previousTranslation={previousParagraphTranslation}
            />
          </Flex>
        )}
      </>
    )
  })
