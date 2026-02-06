import { useTranslation } from 'react-i18next'
import { BiSave } from 'react-icons/bi'
import { Text, useToken } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

import { useIsMobile } from '~hooks/useIsMobile'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

export const FloatingSaveDraftButton = ({
  onSaveDraft,
  draftLastSavedDateTimeString,
  colorTheme = FormColorTheme.Blue,
}: {
  onSaveDraft: () => void
  draftLastSavedDateTimeString?: string
  colorTheme?: FormColorTheme
}) => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [iconColor] = useToken('colors', [`theme-${colorTheme}.500`])

  const tooltipLabel = draftLastSavedDateTimeString
    ? t('features.publicForm.components.saveDraft.tooltip.lastSaved', {
        lastSavedDateTimeString: draftLastSavedDateTimeString,
      })
    : t('features.publicForm.components.saveDraft.tooltip.default')

  return (
    <Tooltip
      placement={isMobile ? 'top' : 'left'}
      label={<Text data-chromatic="ignore">{tooltipLabel}</Text>}
    >
      <IconButton
        variant="outline"
        colorScheme={`theme-${colorTheme}`}
        cursor="pointer"
        _focus={{
          boxShadow: 0,
        }}
        aria-label={t('features.publicForm.components.saveDraft.button.label')}
        icon={<BiSave color={iconColor} />}
        onClick={onSaveDraft}
      />
    </Tooltip>
  )
}
