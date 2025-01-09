import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BiChevronDown } from 'react-icons/bi'
import {
  Button,
  Flex,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from '@chakra-ui/react'

import { Language } from '~shared/types'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useBgColor } from '../PublicFormWrapper'

type LanguageListType = {
  language: Language
  title: string
}

const LANGUAGES: LanguageListType[] = [
  { language: Language.ENGLISH, title: 'English' },
  { language: Language.CHINESE, title: '中文' },
  { language: Language.MALAY, title: 'Melayu' },
  { language: Language.TAMIL, title: 'தமிழ்' },
]

export const LanguageControl = (): JSX.Element | null => {
  const { i18n } = useTranslation()
  const { form, submissionData } = usePublicFormContext()

  const availableLanguages = new Set(form?.supportedLanguages ?? [])

  const languagesList = LANGUAGES.filter((language) =>
    availableLanguages.has(language.language),
  )

  // English language is always supported. Hence if form supports multi-lang
  // and there is more than one supported language available, show the
  // language dropdown.
  const shouldShowLanguageDropdown =
    form?.hasMultiLang && availableLanguages.size > 1

  const bgColour = useBgColor({
    colorTheme: form?.startPage.colorTheme,
  })

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language)
  }

  const selectedI18nLanguage = languagesList.find(
    ({ language }) => language === i18n.language,
  )
  const selectedLanguage =
    selectedI18nLanguage ??
    languagesList.find(({ language }) => language === Language.ENGLISH)

  // For good measure, ensure i18n.language and selectedLanguage line up
  useEffect(() => {
    i18n.changeLanguage(selectedLanguage?.language)
  }, [i18n, selectedLanguage])

  // Submission data is not undefined in the form end page. Use
  // this to not render the language control component in the form
  // end page.
  if (submissionData) return null

  if (!shouldShowLanguageDropdown) return null

  return (
    <Flex
      background={bgColour}
      zIndex={10}
      px={{ base: '1.5rem', md: 0 }}
      justifyContent={{ base: 'start', md: 'center' }}
    >
      <HStack
        mt={{ base: '-1rem', md: '-2rem' }}
        mb={{ base: '1rem', md: 0 }}
        bg="white"
        borderRadius="0.25rem"
        shadow="md"
      >
        <Menu variant="clear">
          <MenuButton
            as={Button}
            rightIcon={<BiChevronDown />}
            variant="clear"
            color="secondary.500"
          >
            {selectedLanguage?.title}
          </MenuButton>
          <MenuList>
            {languagesList.map((language) => {
              return (
                <MenuItem
                  onClick={() => {
                    handleLanguageChange(language.language)
                  }}
                  px={4}
                  h={12}
                  w="140px"
                  id={language.language}
                >
                  {language.title}
                </MenuItem>
              )
            })}
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  )
}
