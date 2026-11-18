import { useTranslation } from 'react-i18next'
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
} from '@chakra-ui/react'

import { FormAuthType } from 'formsg-shared/types/form'
import {
  createLoginIdentityField,
  getLoginIdentityAttrsForAuthType,
  LOGIN_IDENTITY_LABELS,
} from 'formsg-shared/utils/login-identity'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

interface StopSubmitterIdCollectionModalProps {
  authType: FormAuthType
  isOpen: boolean
  isSaving: boolean
  onClose: () => void
  onConfirm: () => void
}

/**
 * Confirms turning off settings-based NRIC/FIN/UEN collection, and shows the
 * fields admins can add later to collect again.
 */
export const StopSubmitterIdCollectionModal = ({
  authType,
  isOpen,
  isSaving,
  onClose,
  onConfirm,
}: StopSubmitterIdCollectionModalProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.singpass.submitterIdCollection',
  })
  const { t: tCommon } = useTranslation()
  const login = authType === FormAuthType.CP ? 'corppass' : 'singpass'
  const handleClose = () => {
    if (!isSaving) onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
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
                {getLoginIdentityAttrsForAuthType(authType).map((attr) => (
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
                ))}
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
              onClick={handleClose}
            >
              {tCommon('features.common.cancel')}
            </Button>
            <Button isLoading={isSaving} onClick={onConfirm}>
              {t('stopCollecting')}
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
