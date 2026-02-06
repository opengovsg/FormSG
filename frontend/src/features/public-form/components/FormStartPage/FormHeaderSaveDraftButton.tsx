import { useTranslation } from 'react-i18next'
import { BiSave } from 'react-icons/bi'
import { Text, useToken } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

export const FormHeaderSaveDraftButton = ({
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
      {isMobile ? (
        <IconButton
          variant="solid"
          colorScheme={`theme-${colorTheme}`}
          cursor="pointer"
          aria-label={t(
            'features.publicForm.components.saveDraft.button.label',
          )}
          icon={<BiSave color={iconColor} />}
          onClick={onSaveDraft}
        />
      ) : (
        <Button
          onClick={onSaveDraft}
          variant="inverseOutline"
          colorScheme={`theme-${colorTheme}`}
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
