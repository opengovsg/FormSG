import { Divider, Flex, HStack, IconButton } from '@chakra-ui/react'

import { Language } from '~shared/types'

import { SingleSelect } from '~components/Dropdown'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useBgColor } from '../PublicFormWrapper'

import { FontDefaultSvgr } from './FontDefaultSvgr'
import { FontLargestSvgr } from './FontLargestSvgr'
import { FontLargeSvgr } from './FontLargeSvgr'

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

  const availableLanguages = form?.supportedLanguages ?? []

  // English language is always supported. Hence if form supports multi-lang
  // and there is more than one supported language available, show the
  // language dropdown.
  const shouldShowLanguageDropdown =
    form?.hasMultiLang && availableLanguages.length > 1

  const bgColour = useBgColor({
    colorTheme: form?.startPage.colorTheme,
  })

  const handleLanguageChange = (language: string) => {
    if (setPublicFormLanguage) {
      setPublicFormLanguage(language as Language)
    }
  }

  return (
    <Flex background={bgColour} justifyContent="center" zIndex={10}>
      <HStack
        mt="-2rem"
        bg="white"
        borderRadius="4px"
        height="3.25rem"
        shadow="md"
        py={4}
        pl={4}
        pr={2}
      >
        {shouldShowLanguageDropdown && (
          <SingleSelect
            placeholder={publicFormLanguage ?? Language.ENGLISH}
            value={publicFormLanguage ?? Language.ENGLISH}
            onChange={handleLanguageChange}
            name={'select form language'}
            items={availableLanguages}
            isClearable={false}
            colorScheme="primary"
          />
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
