import { Control, Controller, FieldErrors } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types'

import { NextAndBackButtonGroup } from '~components/Button'
import Textarea from '~components/Textarea'

type CustomiseEmailFormInputs = {
  subject: string
  senderName: string
  emailBody: string
}

type ModalTextProps = {
  modalHeader: string
  modalInfo: string
}

interface CustomiseEmailModalProps {
  isMobile: boolean
  isOpen: boolean
  onClose: () => void
  setCustomEmail: () => void
  control: Control<CustomiseEmailFormInputs>
  errors: FieldErrors<CustomiseEmailFormInputs>
  responseMode: FormResponseMode | undefined
}

export const CustomiseEmailModal = ({
  isMobile,
  isOpen,
  onClose,
  setCustomEmail,
  control,
  errors,
  responseMode,
}: CustomiseEmailModalProps) => {
  const { t } = useTranslation()

  const ModalText: ModalTextProps =
    responseMode === FormResponseMode.Multirespondent
      ? {
          modalHeader: t(
            'features.adminForm.settings.emailNotifications.section.modal.headerMrf',
          ),
          modalInfo: t(
            'features.adminForm.settings.emailNotifications.section.modal.infoMrf',
          ),
        }
      : {
          modalHeader: t(
            'features.adminForm.settings.emailNotifications.section.modal.headerEncrypt',
          ),
          modalInfo: t(
            'features.adminForm.settings.emailNotifications.section.modal.infoEncrypt',
          ),
        }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent minW="fit-content">
        <ModalCloseButton />
        <ModalHeader>{ModalText.modalHeader}</ModalHeader>
        <ModalBody>
          <Box w={isMobile ? '100%' : '42.5rem'}>
            <Stack spacing="1rem" mb="2.5rem">
              <Text textStyle="subhead-1">{ModalText.modalInfo}</Text>
              <FormControl isInvalid={!!errors.subject}>
                <FormLabel>
                  {t(
                    'features.adminForm.settings.emailNotifications.section.modal.subjectTitle',
                  )}
                </FormLabel>
                <Controller
                  name="subject"
                  control={control}
                  rules={{
                    required: t(
                      'features.adminForm.settings.emailNotifications.section.modal.subjectError',
                    ),
                  }}
                  render={() => <Input></Input>}
                />
              </FormControl>

              <FormControl isInvalid={!!errors.senderName}>
                <FormLabel>
                  {t(
                    'features.adminForm.settings.emailNotifications.section.modal.senderNameTitle',
                  )}
                </FormLabel>
                <Controller
                  name="senderName"
                  control={control}
                  rules={{
                    required: t(
                      'features.adminForm.settings.emailNotifications.section.modal.senderNameError',
                    ),
                  }}
                  render={() => <Input></Input>}
                />
              </FormControl>

              <FormControl isInvalid={!!errors.emailBody}>
                <FormLabel>
                  {t(
                    'features.adminForm.settings.emailNotifications.section.modal.emailBodyTitle',
                  )}
                </FormLabel>
                <Controller
                  name="emailBody"
                  control={control}
                  rules={{
                    required: 'ERROR',
                  }}
                  render={() => (
                    <Textarea
                      placeholder={t(
                        'features.adminForm.settings.emailNotifications.section.modal.emailBodyPlaceholder',
                      )}
                    />
                  )}
                />
              </FormControl>
            </Stack>
          </Box>
        </ModalBody>

        <ModalFooter>
          <NextAndBackButtonGroup
            nextButtonLabel={'Save changes'}
            backButtonLabel={'Cancel'}
            handleBack={onClose}
            handleNext={() => setCustomEmail}
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
