import { BiChevronDown } from 'react-icons/bi'
import {
  Box,
  Button,
  Flex,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
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

export const LanguageControl = (): JSX.Element => {
  const { form, publicFormLanguage, setPublicFormLanguage } =
    usePublicFormContext()

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
    if (setPublicFormLanguage) {
      setPublicFormLanguage(language as Language)
    }
  }

  const selectedLanguage = LANGUAGES.find(
    (language) => language.language === publicFormLanguage,
  )?.title

  return (
    <Flex
      background={bgColour}
      zIndex={10}
      px={{ base: '1.5rem', md: 0 }}
      justifyContent={{ base: 'start', md: 'center' }}
    >
      <HStack mt="-32px" bg="white" borderRadius="4px" shadow="md">
        {shouldShowLanguageDropdown && (
          <Menu variant="clear">
            <MenuButton
              as={Button}
              rightIcon={<BiChevronDown />}
              variant="clear"
              color="secondary.500"
            >
              {selectedLanguage}
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
                  >
                    {language.title}
                  </MenuItem>
                )
              })}
            </MenuList>
          </Menu>
        )}
      </HStack>
    </Flex>
  )
}
