import { useTranslation } from 'react-i18next'
import { BiSave } from 'react-icons/bi'

import { useIsMobile } from '~hooks/useIsMobile'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

export const FloatingSaveDraftButton = ({
  onSaveDraft,
  draftLastSavedDateTimeString,
}: {
  onSaveDraft: () => void
  draftLastSavedDateTimeString?: string
}) => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const tooltipLabel = draftLastSavedDateTimeString
    ? t('features.publicForm.components.saveDraft.tooltip.lastSaved', {
        lastSavedDateTimeString: draftLastSavedDateTimeString,
      })
    : t('features.publicForm.components.saveDraft.tooltip.default')

  return (
    <Tooltip placement={isMobile ? 'top' : 'left'} label={tooltipLabel}>
      <IconButton
        variant="outline"
        cursor="pointer"
        _focus={{
          boxShadow: 0,
        }}
        aria-label={t('features.publicForm.components.saveDraft.button.label')}
        icon={<BiSave color="primary.500" />}
        onClick={onSaveDraft}
      />
    </Tooltip>
  )
}
