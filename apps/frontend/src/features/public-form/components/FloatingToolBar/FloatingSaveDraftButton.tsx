import { useTranslation } from 'react-i18next'
import { BiSave } from 'react-icons/bi'
import { Text } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { useFormColorScheme } from '~features/public-form/utils/useFormColorScheme'

export const FloatingSaveDraftButton = ({
  onSaveDraft,
  draftLastSavedDateTimeString,
}: {
  onSaveDraft: () => void
  draftLastSavedDateTimeString?: string
}) => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const colorScheme = useFormColorScheme()

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
        colorScheme={colorScheme}
        cursor="pointer"
        _focus={{
          boxShadow: 0,
        }}
        aria-label={t('features.publicForm.components.saveDraft.button.label')}
        icon={<BiSave />}
        onClick={onSaveDraft}
      />
    </Tooltip>
  )
}
