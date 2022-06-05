import { Select } from '@chakra-ui/react'
import i18n from 'i18next'

import { locales } from '~/i18n/locales'
import Translation from '~/i18n/locales/types'

interface LanguageSelectorProps {
  disabled?: boolean
}

export const LanguageSelector = ({
  disabled,
}: LanguageSelectorProps): JSX.Element => {
  if (disabled) return <></>

  return (
    <Select
      size="xs"
      defaultValue={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      {Object.entries(locales).map(([langCode, translation]) => (
        <option value={langCode} key={langCode}>
          {
            (translation as unknown as Translation).translation.general
              .languageName
          }
        </option>
      ))}
    </Select>
  )
}
