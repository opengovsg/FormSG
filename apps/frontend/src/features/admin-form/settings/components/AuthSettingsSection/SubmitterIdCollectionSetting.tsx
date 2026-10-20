import { useTranslation } from 'react-i18next'
import { BiLinkExternal } from 'react-icons/bi'
import {
  ButtonGroup,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { FormAuthType, FormSettings } from 'formsg-shared/types/form'
import { getLoginIdentityAttrsForAuthType } from 'formsg-shared/utils/login-identity'

import { GUIDE_NRIC_FIELD } from '~constants/links'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { ModalCloseButton } from '~components/Modal'

import { useMutateFormSettings } from '../../mutations'

import { ConversionPreview } from './ConversionPreview'
import { FormSubmitterIdCollectionToggle } from './FormNricCollectionToggle'

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
  const { t: tCommon } = useTranslation()
  const convertModal = useDisclosure()
  const { mutateConvertSubmitterIdCollection } = useMutateFormSettings()

  const attrs = getLoginIdentityAttrsForAuthType(settings.authType)
  const login = settings.authType === FormAuthType.CP ? 'corppass' : 'singpass'

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
      <Modal
        isOpen={convertModal.isOpen}
        onClose={convertModal.onClose}
        returnFocusOnClose={false}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>{t(`${login}.modalTitle`)}</ModalHeader>
          <ModalBody>
            <ConversionPreview
              attrs={attrs}
              nextQuestionNumber={nextQuestionNumber}
            />
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button
                variant="clear"
                colorScheme="secondary"
                onClick={convertModal.onClose}
              >
                {tCommon('features.common.cancel')}
              </Button>
              <Button
                isLoading={mutateConvertSubmitterIdCollection.isLoading}
                onClick={() => mutateConvertSubmitterIdCollection.mutate()}
              >
                {t('makeTheSwitch')}
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  )
}
