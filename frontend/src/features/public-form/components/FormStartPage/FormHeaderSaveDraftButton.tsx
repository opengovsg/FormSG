import { useTranslation } from 'react-i18next'
import { BiSave } from 'react-icons/bi'
import { Text } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { useDesignColorTheme } from '~features/admin-form/create/builder-and-design/utils/useDesignColorTheme'

export const FormHeaderSaveDraftButton = ({
  onSaveDraft,
  draftLastSavedDateTimeString,
}: {
  onSaveDraft: () => void
  draftLastSavedDateTimeString?: string
}) => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const colorScheme = useDesignColorTheme()

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
      {isMobile ? (
        <IconButton
          variant="solid"
          colorScheme={colorScheme}
          cursor="pointer"
          aria-label={t(
            'features.publicForm.components.saveDraft.button.label',
          )}
          icon={<BiSave />}
          onClick={onSaveDraft}
        />
      ) : (
        <Button
          onClick={onSaveDraft}
          variant="inverseOutline"
          colorScheme={colorScheme}
          leftIcon={<BiSave fontSize="1.25rem" />}
          aria-label={t(
            'features.publicForm.components.saveDraft.button.label',
          )}
        >
          {t('features.publicForm.components.saveDraft.button.label')}
        </Button>
      )}
    </Tooltip>
  )
}
