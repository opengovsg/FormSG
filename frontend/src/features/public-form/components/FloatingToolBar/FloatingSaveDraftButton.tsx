import { useTranslation } from "react-i18next"
import { BiSave } from "react-icons/bi"
import IconButton from "~components/IconButton"
import Tooltip from "~components/Tooltip"
import { useIsMobile } from "~hooks/useIsMobile"

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
        borderBottomRadius={0}
        _focus={{
          boxShadow: 0,
        }}
        aria-label="save a draft"
        icon={<BiSave color="primary.500" />}
        onClick={onSaveDraft}
      />
    </Tooltip>
  )
}