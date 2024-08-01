import { useCallback, useMemo, useState } from 'react'
import { BiEditAlt } from 'react-icons/bi'
import { GoEye, GoEyeClosed } from 'react-icons/go'
import {
  Box,
  Divider,
  Flex,
  HStack,
  IconButton,
  Skeleton,
  Text,
} from '@chakra-ui/react'
import _ from 'lodash'

import { Language } from '~shared/types'

import { convertUnicodeLocaleToLanguage } from '~utils/multiLanguage'
import Badge from '~components/Badge'
import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

interface LanguageTranslationRowProps {
  unicodeLocale: Language
  isDefaultLanguage: boolean
  isLast?: boolean
}

interface LanguageTranslationSectionProps {
  defaultLanguage: Language
}

const LanguageTranslationRow = ({
  unicodeLocale,
  isDefaultLanguage,
  isLast,
}: LanguageTranslationRowProps): JSX.Element => {
  const { data: settings } = useAdminFormSettings()

  const supportedLanguages = settings?.supportedLanguages ?? null

  const [isLanguageSupported, setIsLanguageSupported] = useState(
    supportedLanguages?.indexOf(unicodeLocale) !== -1,
  )

  const languageToDisplay = convertUnicodeLocaleToLanguage(unicodeLocale)

  const { mutateFormSupportedLanguages } = useMutateFormSettings()

  const handleToggleSupportedLanague = useCallback(
    (language: Language) => {
      if (supportedLanguages == null) return

      // Remove support for this language if it exists in supportedLanguages
      const existingSupportedLanguageIdx = supportedLanguages.indexOf(language)
      if (existingSupportedLanguageIdx !== -1) {
        supportedLanguages.splice(existingSupportedLanguageIdx, 1)
        setIsLanguageSupported(false)
        return mutateFormSupportedLanguages.mutate({
          nextSupportedLanguages: supportedLanguages,
          selectedLanguage: language,
        })
      }

      // If selected language is not in supportedLanguages then add this language
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

  return (
    <>
      <Flex alignItems="center" w="100%" py={2}>
        <Flex marginRight="auto">
          <Text mr="0.75rem">{languageToDisplay}</Text>
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
              aria-label={`Select ${unicodeLocale} as the form's default language`}
              onClick={() => handleToggleSupportedLanague(unicodeLocale)}
            />
            <IconButton
              variant="clear"
              icon={<BiEditAlt width="44px" />}
              colorScheme="secondary"
              aria-label={`Add ${unicodeLocale} translations`}
              // TODO: Will add redirection to translation section in next PR
              onClick={() => console.log('Edit translations')}
            />
          </HStack>
        )}
      </Flex>
      {!isLast && <Divider />}
    </>
  )
}

const LanguageTranslationSection = ({
  defaultLanguage,
}: LanguageTranslationSectionProps): JSX.Element => {
  let unicodeLocales = Object.values(Language)

  const idxToRemove = unicodeLocales.indexOf(defaultLanguage)
  unicodeLocales.splice(idxToRemove, 1)

  unicodeLocales = [defaultLanguage, ...unicodeLocales]

  return (
    <Box pt={8}>
      {unicodeLocales.map((unicodeLocale, id, arr) => {
        return (
          <LanguageTranslationRow
            unicodeLocale={unicodeLocale}
            isDefaultLanguage={unicodeLocale === defaultLanguage}
            isLast={id === arr.length - 1}
            key={unicodeLocale}
          />
        )
      })}
    </Box>
  )
}

export const FormMultiLanguageToggle = (): JSX.Element => {
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const { mutateFormSupportedLanguages, mutateFormHasMultiLang } =
    useMutateFormSettings()

  const hasMultiLang = useMemo(
    () => settings && settings?.hasMultiLang,
    [settings],
  )

  const handleToggleMultiLang = useCallback(() => {
    if (!settings || isLoadingSettings || mutateFormHasMultiLang.isLoading)
      return

    const nextHasMultiLang = !settings.hasMultiLang

    const currentSupportedLanguages = settings?.supportedLanguages

    // Restore back previously supported languages.
    let nextSupportedLanguages = currentSupportedLanguages

    // Add all languages as this is the first instance user turns on
    // toggle
    if (_.isEmpty(currentSupportedLanguages) && nextHasMultiLang) {
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
