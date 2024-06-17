import { BiChevronDown } from 'react-icons/bi'
import {
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react'

import { Language } from '~shared/types'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useBgColor } from '../PublicFormWrapper'

import { FontDefaultSvgr } from './FontDefaultSvgr'
import { FontLargestSvgr } from './FontLargestSvgr'
import { FontLargeSvgr } from './FontLargeSvgr'

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

export const ZoomControl = ({
  setDefaultSize,
  setLargeSize,
  setLargestSize,
}: {
  setDefaultSize: () => void
  setLargeSize: () => void
  setLargestSize: () => void
}): JSX.Element => {
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
      <HStack
        mt="-32px"
        bg="white"
        borderRadius="4px"
        height="52px"
        shadow="md"
        py="14px"
        pl="16px"
        pr="16px"
      >
        {shouldShowLanguageDropdown && (
          <Box mr="48px">
            <Menu variant="clear">
              <MenuButton
                as={Button}
                rightIcon={<BiChevronDown />}
                variant="clear"
                color="secondary.500"
                size="16px"
              >
                <Text fontSize="16px">{selectedLanguage}</Text>
              </MenuButton>
              <MenuList>
                {languagesList.map((language) => {
                  return (
                    <MenuItem
                      onClick={() => {
                        handleLanguageChange(language.language)
                      }}
                    >
                      <Text fontSize="16px">{language.title}</Text>
                    </MenuItem>
                  )
                })}
              </MenuList>
            </Menu>
          </Box>
        )}

        <IconButton
          variant="clear"
          aria-label="Default font size"
          icon={<FontDefaultSvgr />}
          onClick={setDefaultSize}
        />
        <Divider orientation="vertical" height="1.5rem" />
        <IconButton
          variant="clear"
          aria-label="Larger font size"
          icon={<FontLargeSvgr />}
          onClick={setLargeSize}
        />
        <Divider orientation="vertical" height="1.5rem" />
        <IconButton
          variant="clear"
          aria-label="Largest font size"
          icon={<FontLargestSvgr />}
          onClick={setLargestSize}
        />
      </HStack>
    </Flex>
  )
}
