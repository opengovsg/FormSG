import { useCallback, useMemo, useState } from 'react'
import { BiEditAlt } from 'react-icons/bi'
import { GoEye, GoEyeClosed } from 'react-icons/go'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Divider,
  Flex,
  HStack,
  IconButton,
  Skeleton,
  Text,
} from '@chakra-ui/react'

import { Language } from '~shared/types'

import { ADMINFORM_ROUTE } from '~constants/routes'
import Badge from '~components/Badge'
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

      // remove support for this language if it exists in supportedLanguages
      const existingSupportedLanguageIdx = supportedLanguages.indexOf(language)
      if (existingSupportedLanguageIdx !== -1) {
        supportedLanguages.splice(existingSupportedLanguageIdx, 1)
        setIsLanguageSupported(false)
        return mutateFormSupportedLanguages.mutate({
          nextSupportedLanguages: supportedLanguages,
          selectedLanguage: language,
        })
      }
      // if selected language is not in supportedLanguages then add this language
      // to supportedLanguages
      else {
        const updatedSupportedLanguages = supportedLanguages.concat(language)
        setIsLanguageSupported(true)
        return mutateFormSupportedLanguages.mutate({
          nextSupportedLanguages: updatedSupportedLanguages,
          selectedLanguage: language,
        })
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
      <Flex alignItems="center" w="100%" mt="2rem">
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

export const FormMultiLangToggle = (): JSX.Element => {
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const { mutateFormSupportedLanguages, mutateFormHasMultiLang } =
    useMutateFormSettings()

  const hasMultiLang = useMemo(
    () => settings && settings?.hasMultiLang,
    [settings],
  )

  console.log(hasMultiLang)

  const handleToggleMultiLang = useCallback(() => {
    if (!settings || isLoadingSettings || mutateFormHasMultiLang.isLoading)
      return

    // get next hasMultiLang value
    const nextHasMultiLang = !settings.hasMultiLang

    // toggle multi lang on: add all supported languages if there were no supported
    // languages previously or restore back previously supported languages
    let nextSupportedLanguages = settings.supportedLanguages ?? []

    if (!nextHasMultiLang && nextSupportedLanguages.length === 0) {
      nextSupportedLanguages = Object.values(Language)
    }

    mutateFormSupportedLanguages.mutate({ nextSupportedLanguages })

    return mutateFormHasMultiLang.mutate(nextHasMultiLang)
  }, [
    isLoadingSettings,
    mutateFormHasMultiLang,
    mutateFormSupportedLanguages,
    settings,
  ])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings} mt="2rem">
      <Toggle
        onChange={handleToggleMultiLang}
        isChecked={hasMultiLang}
        label="Enable multi-language"
        description="This will allow respondents to select a language they prefer to view your form in. Translations are not automated."
      />
      {settings && hasMultiLang && (
        <Skeleton isLoaded={true}>
          <LanguageTranslationSection defaultLanguage={Language.ENGLISH} />
        </Skeleton>
      )}
    </Skeleton>
  )
}
