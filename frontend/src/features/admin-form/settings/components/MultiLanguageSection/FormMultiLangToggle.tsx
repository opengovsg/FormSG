import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'
import { BiEditAlt } from 'react-icons/bi'
import { GoEye, GoEyeClosed } from 'react-icons/go'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Divider,
  Flex,
  FormControl,
  HStack,
  IconButton,
  Skeleton,
  Text,
} from '@chakra-ui/react'

import { Language } from '~shared/types'

import { ADMINFORM_ROUTE } from '~constants/routes'
import Badge from '~components/Badge'
import { SingleSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

interface LanguageTranslationRowProps {
  language: Language
  isDefaultLanguage: boolean
  isLast?: boolean
}

interface LanguageTranslationSectionProps {
  defaultLanguage: Language
}

interface MultiLangBlockProps {
  selectedDefaultLanguage: Language | null
}

const LanguageTranslationRow = ({
  language,
  isDefaultLanguage,
  isLast,
}: LanguageTranslationRowProps): JSX.Element => {
  const { formId } = useParams()
  const { data: settings } = useAdminFormSettings()
  const navigate = useNavigate()

  const supportedLanguages = settings?.supportedLanguages ?? null

  const [isLanguageSupported, setIsLanguageSupported] = useState(
    supportedLanguages?.indexOf(language) !== -1,
  )

  const { mutateFormSupportedLanguages } = useMutateFormSettings()

  const handleToggleSupportedLanague = useCallback(
    (language: Language) => {
      if (supportedLanguages == null) return

      // remove support for this language if it exists in supported language
      const existingSupportedLanguageIdx = supportedLanguages.indexOf(language)
      if (existingSupportedLanguageIdx !== -1) {
        supportedLanguages.splice(existingSupportedLanguageIdx, 1)
        setIsLanguageSupported(false)
        return mutateFormSupportedLanguages.mutate(supportedLanguages)
      } else {
        const updatedSupportedLanguages = supportedLanguages.concat(language)
        setIsLanguageSupported(true)
        return mutateFormSupportedLanguages.mutate(updatedSupportedLanguages)
      }
    },
    [mutateFormSupportedLanguages, supportedLanguages],
  )

  const handleLanguageTranslationEditClick = useCallback(
    (language: Language) => {
      const lowerCaseLanguage = language.toLowerCase()
      navigate(
        `${ADMINFORM_ROUTE}/${formId}/settings/multi-language/${lowerCaseLanguage}`,
      )
    },
    [formId, navigate],
  )

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
              icon={
                isLanguageSupported ? (
                  <GoEye width="44px" />
                ) : (
                  <GoEyeClosed width="44px" />
                )
              }
              colorScheme="secondary"
              aria-label={`Select ${language} as the form's default language`}
              onClick={() => handleToggleSupportedLanague(language)}
            />
            <IconButton
              variant="clear"
              icon={<BiEditAlt width="44px" />}
              colorScheme="secondary"
              aria-label={`Add ${language} translations`}
              onClick={() => handleLanguageTranslationEditClick(language)}
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
  let languages = Object.values(Language)

  const idxToRemove = languages.indexOf(defaultLanguage)
  languages.splice(idxToRemove, 1)

  languages = [defaultLanguage, ...languages]

  return (
    <>
      {languages.map((language, id, arr) => {
        return (
          <>
            <LanguageTranslationRow
              language={language}
              isDefaultLanguage={language === defaultLanguage}
              isLast={id === arr.length}
              key={language}
            />
          </>
        )
      })}
    </>
  )
}

const MultiLangBlock = ({
  selectedDefaultLanguage,
}: MultiLangBlockProps): JSX.Element => {
  const { mutateFormDefaultLang } = useMutateFormSettings()

  const [defaultLanguage, setDefaultLanguage] = useState(
    selectedDefaultLanguage ?? Language.ENGLISH,
  )

  const handleDefaultLanguageChange = useCallback(
    (language: string) => {
      const selectedDefaultLanguage: Language = language as Language
      setDefaultLanguage(selectedDefaultLanguage)
      return mutateFormDefaultLang.mutate(selectedDefaultLanguage)
    },
    [mutateFormDefaultLang],
  )

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
          onChange={handleDefaultLanguageChange}
          name={'selectDefaultLanguage'}
          items={Object.values(Language)}
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

  const { mutateFormDefaultLang, mutateFormSupportedLanguages } =
    useMutateFormSettings()

  const isDefaultLanguageSelected = useMemo(
    () =>
      settings &&
      typeof settings?.defaultLanguage !== 'undefined' &&
      settings?.defaultLanguage !== null,
    [settings],
  )

  const handleToggleMultiLang = useCallback(() => {
    if (!settings || isLoadingSettings || mutateFormDefaultLang.isLoading)
      return

    // toggle multi lang off
    if (settings.defaultLanguage && settings.defaultLanguage != null) {
      mutateFormSupportedLanguages.mutate(null)
      return mutateFormDefaultLang.mutate(null)
    }

    // toggle multi lang on and add all supported languages
    mutateFormSupportedLanguages.mutate(Object.values(Language))
    return mutateFormDefaultLang.mutate(
      settings?.defaultLanguage ?? Language.ENGLISH,
    )
  }, [
    isLoadingSettings,
    mutateFormDefaultLang,
    mutateFormSupportedLanguages,
    settings,
  ])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings} mt="2rem">
      <Toggle
        onChange={handleToggleMultiLang}
        isChecked={isDefaultLanguageSelected}
        label="Enable multi-language"
        description="This will allow respondents to select a language they prefer to view your form in. Translations are not automated."
      />
      {settings && settings.defaultLanguage && (
        <Skeleton isLoaded={true}>
          <MultiLangBlock selectedDefaultLanguage={settings?.defaultLanguage} />
        </Skeleton>
      )}
    </Skeleton>
  )
}
