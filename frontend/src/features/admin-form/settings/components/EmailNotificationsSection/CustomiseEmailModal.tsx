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
} from '@chakra-ui/react'

import Textarea from '~components/Textarea'

type CustomiseEmailFormInputs = {
  subject: string
  senderName: string
  emailBody: string
}

interface CustomiseEmailModalProps {
  isMobile: boolean
  isOpen: boolean
  onClose: () => void
  setCustomEmail: () => void
  control: Control<CustomiseEmailFormInputs>
  errors: FieldErrors<CustomiseEmailFormInputs>
}

export const CustomiseEmailModal = ({
  isMobile,
  isOpen,
  onClose,
  setCustomEmail,
  control,
  errors,
}: CustomiseEmailModalProps) => {
  const { t } = useTranslation()
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent minW="fit-content">
        <ModalCloseButton />
        <ModalHeader>Edit email acknowledgement</ModalHeader>
        <ModalBody>
          <Box w={isMobile ? '100%' : '42.5rem'}>
            <Stack spacing="0.5rem" mb="2.5rem">
              <FormControl isInvalid={!!errors.subject}>
                <FormLabel>Subject</FormLabel>
                <Controller
                  name="subject"
                  control={control}
                  rules={{
                    required: 'ERROR',
                  }}
                  render={() => <Input></Input>}
                />
              </FormControl>

              <FormControl isInvalid={!!errors.senderName}>
                <FormLabel>Sender name</FormLabel>
                <Controller
                  name="senderName"
                  control={control}
                  rules={{
                    required: 'ERROR',
                  }}
                  render={() => <Input></Input>}
                />
              </FormControl>

              <FormControl isInvalid={!!errors.emailBody}>
                <FormLabel>Email body</FormLabel>
                <Controller
                  name="emailBody"
                  control={control}
                  rules={{
                    required: 'ERROR',
                  }}
                  render={() => <Textarea />}
                />
              </FormControl>
            </Stack>
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button
            textStyle="subhead-2"
            // isLoading={isNextLoading}
            // colorScheme={nextButtonColorScheme}
            // isDisabled={isNextDisabled}
            onClick={() => {}}
            // isFullWidth={isMobile}
            // leftIcon={nextButtonIcon}
          >
            Save Edit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
