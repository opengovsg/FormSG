import { useTranslation } from 'react-i18next'
import { BiLinkExternal } from 'react-icons/bi'
import { Stack, Text, useDisclosure } from '@chakra-ui/react'

import { FormAuthType, FormSettings } from 'formsg-shared/types/form'

import { GUIDE_NRIC_FIELD } from '~constants/links'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'

import { StopSubmitterIdCollectionModal } from './StopSubmitterIdCollectionModal'
import { SubmitterIdConversionModal } from './SubmitterIdConversionModal'

interface SubmitterIdCollectionSettingProps {
  settings: FormSettings
  isFormPublic: boolean
  nextQuestionNumber?: number
  onStoppedCollecting?: () => void
}

export const SubmitterIdCollectionSetting = ({
  settings,
  isFormPublic,
  nextQuestionNumber,
  onStoppedCollecting,
}: SubmitterIdCollectionSettingProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.singpass.submitterIdCollection',
  })
  const convertModal = useDisclosure()
  const stopModal = useDisclosure()
  const { mutateIsSubmitterIdCollectionEnabled } = useMutateFormSettings()
  const isSaving = mutateIsSubmitterIdCollectionEnabled.isLoading
  const login = settings.authType === FormAuthType.CP ? 'corppass' : 'singpass'

  const handleStopCollecting = async () => {
    if (isSaving || isFormPublic) return
    try {
      // Await the save even if its cache update unmounts this modal.
      await mutateIsSubmitterIdCollectionEnabled.mutateAsync(false)
      stopModal.onClose()
      onStoppedCollecting?.()
    } catch {
      // The mutation reports the error; keep the modal open to retry.
    }
  }

  return (
    <Stack spacing="1rem">
      <Toggle
        containerStyles={{ opacity: isFormPublic ? 0.8 : 1 }}
        isDisabled={isFormPublic || isSaving}
        isLoading={isSaving}
        isChecked={!!settings.isSubmitterIdCollectionEnabled}
        label={t('toggleLabel')}
        onChange={stopModal.onOpen}
      />
      <InlineMessage variant="info">
        <Stack spacing="0.75rem" align="flex-start">
          <Text>
            {t(`${login}.switchHint`)} {t('autoConvertNotice')}
          </Text>
          <Stack direction={{ base: 'column', sm: 'row' }} spacing="0.5rem">
            <Button
              variant="outline"
              onClick={convertModal.onOpen}
              isDisabled={isFormPublic}
            >
              {t('convert')}
            </Button>
            <Button
              as="a"
              href={GUIDE_NRIC_FIELD}
              target="_blank"
              rel="noopener noreferrer"
              variant="clear"
              rightIcon={<BiLinkExternal aria-hidden />}
            >
              {t('learnMore')}
            </Button>
          </Stack>
          {isFormPublic ? (
            <Text textStyle="caption-1">{t('closeFormToConvert')}</Text>
          ) : null}
        </Stack>
      </InlineMessage>
      <StopSubmitterIdCollectionModal
        authType={settings.authType}
        isOpen={stopModal.isOpen}
        isSaving={isSaving}
        onClose={stopModal.onClose}
        onConfirm={handleStopCollecting}
      />
      <SubmitterIdConversionModal
        authType={settings.authType}
        isOpen={convertModal.isOpen}
        onClose={convertModal.onClose}
        nextQuestionNumber={nextQuestionNumber}
      />
    </Stack>
  )
}
