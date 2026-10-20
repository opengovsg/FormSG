import { useTranslation } from 'react-i18next'
import { BiLinkExternal } from 'react-icons/bi'
import { Stack, Text, useDisclosure } from '@chakra-ui/react'

import { FormSettings } from 'formsg-shared/types/form'

import { GUIDE_NRIC_FIELD } from '~constants/links'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

import { FormSubmitterIdCollectionToggle } from './FormNricCollectionToggle'
import { SubmitterIdConversionModal } from './SubmitterIdConversionModal'

interface SubmitterIdCollectionSettingProps {
  settings: FormSettings
  isFormPublic: boolean
  nextQuestionNumber?: number
}

export const SubmitterIdCollectionSetting = ({
  settings,
  isFormPublic,
  nextQuestionNumber,
}: SubmitterIdCollectionSettingProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.singpass.submitterIdCollection',
  })
  const convertModal = useDisclosure()

  return (
    <Stack spacing="1rem">
      <FormSubmitterIdCollectionToggle settings={settings} isDisabled />
      <InlineMessage variant="warning">
        <Stack spacing="0.75rem" align="flex-start">
          <Text>{t('stopHint')}</Text>
          <Text>{t('autoConvertNotice')}</Text>
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
      <SubmitterIdConversionModal
        authType={settings.authType}
        isOpen={convertModal.isOpen}
        onClose={convertModal.onClose}
        nextQuestionNumber={nextQuestionNumber}
      />
    </Stack>
  )
}
