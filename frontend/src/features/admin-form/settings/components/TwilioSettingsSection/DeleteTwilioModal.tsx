import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { useMutateTwilioCreds } from '../../mutations'

interface DeleteTwilioModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
}

export const DeleteTwilioModal = ({
  isOpen,
  onClose,
  onDelete,
}: DeleteTwilioModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  const { formId } = useParams()
  if (!formId) throw new Error('No form ID!')

  const { mutateFormTwilioDeletion } = useMutateTwilioCreds()

  const handleConfirmDeleteCreds = useCallback(() => {
    mutateFormTwilioDeletion.mutate(undefined, {
      onSuccess: () => {
        onDelete()
        onClose()
      },
    })
  }, [mutateFormTwilioDeletion, onClose, onDelete])

  return (
    <Modal size={modalSize} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">
          Remove Twilio credentials
        </ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Text textStyle="body-2" color="secondary.500">
            Are you sure you want to remove your Twilio credentials? You will
            not be able to use the Verified SMS feature unless you have free
            SMSes remaining.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Stack
            direction={modalSize === 'mobile' ? 'column' : 'row'}
            w="100%"
            justify="flex-end"
          >
            <Button
              variant="clear"
              colorScheme="secondary"
              isFullWidth={modalSize === 'mobile'}
              onClick={onClose}
            >
              No, don't remove
            </Button>
            <Button
              colorScheme="danger"
              isFullWidth={modalSize === 'mobile'}
              isLoading={mutateFormTwilioDeletion.isLoading}
              onClick={handleConfirmDeleteCreds}
            >
              Yes, remove Twilio credentials
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
