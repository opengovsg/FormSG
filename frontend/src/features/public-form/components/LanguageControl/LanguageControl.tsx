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
  const {
    form,
    selectedPublicFormLanguage,
    setSelectedPublicFormLanguage,
    submissionData,
  } = usePublicFormContext()

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
    if (setSelectedPublicFormLanguage) {
      setSelectedPublicFormLanguage(language as Language)
    }
  }

  const selectedLanguage = LANGUAGES.find(
    (language) => language.language === selectedPublicFormLanguage,
  )?.title

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
      <HStack mt="-32px" bg="white" borderRadius="4px" shadow="md">
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
