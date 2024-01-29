import { useCallback, useState } from 'react'
import { BiEditAlt } from 'react-icons/bi'
import { GoEye } from 'react-icons/go'
import {
  Divider,
  Flex,
  FormControl,
  HStack,
  IconButton,
  Skeleton,
  Text,
} from '@chakra-ui/react'

import Badge from '~components/Badge'
import { SingleSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import Toggle from '~components/Toggle'

import { useAdminFormSettings } from '../queries'

enum LANGUAGES {
  ENGLISH = 'English',
  CHINESE = 'Chinese',
  MALAY = 'Malay',
  TAMIL = 'Tamil',
}

interface LanguageTranslationRowProps {
  language: LANGUAGES
  isDefaultLanguage: boolean
  isLast?: boolean
}

interface LanguageTranslationSectionProps {
  defaultLanguage: LANGUAGES
}

const LanguageTranslationRow = ({
  language,
  isDefaultLanguage,
  isLast,
}: LanguageTranslationRowProps): JSX.Element => {
  return (
    <>
      <Flex alignItems="center" w="100%">
        <Flex marginRight="auto">
          <Text mr="0.75rem">{language}</Text>
          {isDefaultLanguage && (
            <Badge variant="solid" colorScheme="success" color="secondary.700">
              Default
            </Badge>
          )}
        </Flex>
        {!isDefaultLanguage && (
          <HStack spacing="0.75rem">
            <IconButton
              variant="clear"
              icon={<GoEye width="44px" />}
              colorScheme="secondary"
              aria-label={`Select ${language} as the form's default language`}
            />
            <IconButton
              variant="clear"
              icon={<BiEditAlt width="44px" />}
              colorScheme="secondary"
              aria-label={`Add ${language} translations`}
            />
          </HStack>
        )}
      </Flex>
      {!isLast && <Divider my="1.125rem" />}
    </>
  )
}

const LanguageTranslationSection = ({
  defaultLanguage,
}: LanguageTranslationSectionProps): JSX.Element => {
  const languages = Object.values(LANGUAGES)

  return (
    <>
      {languages.map((language, id, arr) => {
        return (
          <>
            <LanguageTranslationRow
              language={language}
              isDefaultLanguage={language === defaultLanguage}
              isLast={id === arr.length}
            />
          </>
        )
      })}
    </>
  )
}

const MultiLangBlock = (): JSX.Element => {
  const [defaultLanguage, setDefaultLanguage] = useState(LANGUAGES.ENGLISH)

  const selectDefaultLanguageChange = (language: string) => {
    const selectedDefaultLanguage: LANGUAGES = language as LANGUAGES
    setDefaultLanguage(selectedDefaultLanguage)
  }

  return (
    <>
      <FormControl mt="2rem" mb="2.5rem">
        <FormLabel
          isRequired
          description="Select the language that you created this form in. This will be the language that we display when respondents open the form."
        >
          Default Language
        </FormLabel>
        <SingleSelect
          value={defaultLanguage}
          onChange={selectDefaultLanguageChange}
          name={'selectDefaultLanguage'}
          items={Object.values(LANGUAGES)}
          isClearable={false}
        />
      </FormControl>
      <LanguageTranslationSection defaultLanguage={defaultLanguage} />
    </>
  )
}

export const FormMultiLangToggle = (): JSX.Element => {
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  console.log(settings)

  const handleToggleMultiLang = useCallback(() => {
    if (!settings || isLoadingSettings) return
  }, [isLoadingSettings, settings])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings} mt="2rem">
      <Toggle
        onChange={() => console.log('toggle changed')}
        label="Enable multi-language"
        description="This will allow respondents to select a language they prefer to view your form in. Translations are not automated."
      />
      {settings && (
        <Skeleton isLoaded={true}>
          <MultiLangBlock />
        </Skeleton>
      )}
    </Skeleton>
  )
}
