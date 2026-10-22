import { useTranslation } from 'react-i18next'
import { BiLinkExternal } from 'react-icons/bi'
import {
  ButtonGroup,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  StackDivider,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { FormAuthType, FormSettings } from 'formsg-shared/types/form'
import {
  createLoginIdentityField,
  getLoginIdentityAttrsForAuthType,
  LOGIN_IDENTITY_LABELS,
} from 'formsg-shared/utils/login-identity'

import { GUIDE_NRIC_FIELD } from '~constants/links'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { ModalCloseButton } from '~components/Modal'
import Toggle from '~components/Toggle'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

import { useMutateFormSettings } from '../../mutations'

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
  const { t: tCommon } = useTranslation()
  const { mutateIsSubmitterIdCollectionEnabled } = useMutateFormSettings()
  const isSaving = mutateIsSubmitterIdCollectionEnabled.isLoading
  const login = settings.authType === FormAuthType.CP ? 'corppass' : 'singpass'
  const closeStopModal = () => {
    if (!isSaving) stopModal.onClose()
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
      <Modal
        isOpen={stopModal.isOpen}
        onClose={closeStopModal}
        closeOnEsc={!isSaving}
        closeOnOverlayClick={!isSaving}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton isDisabled={isSaving} />
          <ModalHeader>{t(`${login}.stopTitle`)}</ModalHeader>
          <ModalBody>
            <Stack spacing="1.5rem">
              <Text>{t(`${login}.stopDescription`)}</Text>
              <Stack
                spacing="1rem"
                bg="white"
                borderWidth="1px"
                borderColor="neutral.300"
                borderRadius="md"
                p={{ base: '1rem', md: '1.5rem' }}
              >
                <Text color="secondary.500">
                  {t(`${login}.collectLaterDescription`)}
                </Text>
                <Stack
                  spacing={0}
                  divider={<StackDivider borderColor="neutral.300" />}
                >
                  {getLoginIdentityAttrsForAuthType(settings.authType).map(
                    (attr) => (
                      <Stack
                        key={attr}
                        px="1.5rem"
                        py="1rem"
                        spacing="1.5rem"
                        direction="row"
                        align="center"
                        color="secondary.500"
                      >
                        <Icon
                          aria-hidden
                          fontSize="1.5rem"
                          as={
                            BASICFIELD_TO_DRAWER_META[
                              createLoginIdentityField(attr).fieldType
                            ].icon
                          }
                        />
                        <Text textStyle="body-1">
                          {LOGIN_IDENTITY_LABELS[attr]}
                        </Text>
                      </Stack>
                    ),
                  )}
                </Stack>
              </Stack>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button
                variant="clear"
                colorScheme="secondary"
                isDisabled={isSaving}
                onClick={closeStopModal}
              >
                {tCommon('features.common.cancel')}
              </Button>
              <Button
                isLoading={isSaving}
                onClick={async () => {
                  if (isSaving || isFormPublic) return
                  try {
                    // Await the save even if its cache update unmounts this modal.
                    await mutateIsSubmitterIdCollectionEnabled.mutateAsync(
                      false,
                    )
                    stopModal.onClose()
                    onStoppedCollecting?.()
                  } catch {
                    // The mutation reports the error; keep the modal open to retry.
                  }
                }}
              >
                {t('stopCollecting')}
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <SubmitterIdConversionModal
        authType={settings.authType}
        isOpen={convertModal.isOpen}
        onClose={convertModal.onClose}
        nextQuestionNumber={nextQuestionNumber}
      />
    </Stack>
  )
}
