import { useCallback, useState } from 'react'
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

import {
  convertUnicodeLocaleToLanguage,
  getDefaultSupportedLanguages,
} from '~utils/multiLanguage'
import Badge from '~components/Badge'
import Toggle from '~components/Toggle'
import Tooltip from '~components/Tooltip'

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

  const handleToggleSupportedLanguage = useCallback(
    (language: Language) => {
      if (supportedLanguages == null) return

      const isLanguageSupportedPreviously = !!supportedLanguages.find(
        (supportedLanguage) => supportedLanguage == language,
      )
      const isAddSupport = !isLanguageSupportedPreviously
      const updatedSupportedLanguages = isAddSupport
        ? supportedLanguages.concat(language)
        : supportedLanguages.filter((l) => l !== language)

      setIsLanguageSupported(isAddSupport)

      return mutateFormSupportedLanguages.mutate({
        nextSupportedLanguages: updatedSupportedLanguages,
        selectedLanguage: language,
      })
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
            <Tooltip label="Hide/show language on form">
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
                onClick={() => handleToggleSupportedLanguage(unicodeLocale)}
              />
            </Tooltip>
            <Tooltip label="Edit translation">
              <IconButton
                variant="clear"
                icon={<BiEditAlt width="44px" />}
                colorScheme="secondary"
                aria-label={`Add ${unicodeLocale} translations`}
                // TODO: Will add redirection to translation section in next PR
                onClick={() => console.log('Edit translations')}
              />
            </Tooltip>
          </HStack>
        )}
      </Flex>
      {!isLast ? <Divider /> : null}
    </>
  )
}

const LanguageTranslationSection = ({
  defaultLanguage,
}: LanguageTranslationSectionProps): JSX.Element => {
  let unicodeLocales = getDefaultSupportedLanguages()

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

  const hasMultiLang = settings && settings?.hasMultiLang

  const handleToggleMultiLang = useCallback(() => {
    if (!settings || isLoadingSettings || mutateFormHasMultiLang.isLoading)
      return

    const nextHasMultiLang = !settings.hasMultiLang

    const currentSupportedLanguages = settings.supportedLanguages

    // Add all languages as this is the first instance user turns on
    // toggle
    if (_.isEmpty(currentSupportedLanguages) && nextHasMultiLang) {
      const nextSupportedLanguages = getDefaultSupportedLanguages()
      mutateFormSupportedLanguages.mutate({ nextSupportedLanguages })
    }

    mutateFormHasMultiLang.mutate(nextHasMultiLang)
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
      {settings && hasMultiLang ? (
        <Skeleton isLoaded={true}>
          <LanguageTranslationSection defaultLanguage={Language.ENGLISH} />
        </Skeleton>
      ) : null}
    </Skeleton>
  )
}
