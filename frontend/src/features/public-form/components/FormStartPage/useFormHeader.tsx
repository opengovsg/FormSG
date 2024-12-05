import { useMemo } from 'react'

import { FormColorTheme, FormStartPage, Language } from '~shared/types'

import { ThemeColorScheme } from '~theme/foundations/colours'

interface UseFormHeaderProps {
  startPage?: FormStartPage
  hover?: boolean
  selectedLanguage?: Language
}

const getEstTimeTranslation = ({
  estTime,
  selectedLanguage,
}: {
  estTime: number
  selectedLanguage: Language
}) => {
  switch (selectedLanguage) {
    case Language.CHINESE:
      return `预计需要 ${estTime} 分钟完成`
    case Language.MALAY:
      return `Anggaran masa ${estTime} min untuk selesai`
    case Language.TAMIL:
      return `இந்த படிவத்தை முடிக்க கணக்கிடப்பட்ட நேரம் ${estTime} நிமிடங்கள் ஆகும்`
    default:
      return `${estTime} mins estimated time to complete`
  }
}

export const getTitleBg = (colorTheme?: FormColorTheme, hover?: boolean) =>
  colorTheme ? `theme-${colorTheme}.${hover ? 6 : 5}00` : `neutral.200`

export const useFormHeader = ({
  startPage,
  hover,
  selectedLanguage = Language.ENGLISH,
}: UseFormHeaderProps) => {
  const titleColor = useMemo(() => {
    if (startPage?.colorTheme === FormColorTheme.Orange) {
      return 'secondary.700'
    }
    return 'white'
  }, [startPage?.colorTheme])

  const titleBg = useMemo(
    () => getTitleBg(startPage?.colorTheme, hover),
    [hover, startPage?.colorTheme],
  )

  const estTimeString = useMemo(() => {
    if (!startPage?.estTimeTaken) return ''
    const title = getEstTimeTranslation({
      estTime: startPage.estTimeTaken,
      selectedLanguage,
    })
    return title
  }, [selectedLanguage, startPage?.estTimeTaken])

  const colorScheme: ThemeColorScheme | undefined = useMemo(() => {
    if (!startPage?.colorTheme) return
    return `theme-${startPage.colorTheme}` as const
  }, [startPage?.colorTheme])

  return {
    titleColor,
    titleBg,
    estTimeString,
    colorScheme,
  }
}
