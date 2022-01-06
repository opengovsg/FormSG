import { useParams } from 'react-router-dom'
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import { ModalCloseButton } from '~components/Modal'

import { useMutateTwilioCreds } from '../../mutations'

interface DeleteTwilioModalProps {
  isOpen: boolean
  onClose: () => void
  reset: (x: any) => void
}

export const DeleteTwilioModal = ({
  isOpen,
  onClose,
  reset,
}: DeleteTwilioModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  const { formId } = useParams()
  if (!formId) throw new Error('No form ID!')

  const { mutateFormTwilioDeletion } = useMutateTwilioCreds()

  return (
    <Modal size={modalSize} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">
          Remove Twilio credentials
        </ModalHeader>
        <ModalBody whiteSpace="pre-line" pb="3.25rem">
          <Text textStyle="body-2" color="secondary.500">
            Are you sure you want to remove your Twilio credentials? You will
            not be able to use the Verified SMS feature unless you have free
            SMSes remaining.
          </Text>
          <div
            style={{
              display: 'flex',
              justifyContent: 'right',
              alignItems: 'center',
            }}
          >
            <Text
              style={{ padding: '10px 16px', alignItems: 'center' }}
              onClick={onClose}
            >
              No, don’t remove
            </Text>
            <Button
              style={{
                background: '#C05050',
                padding: '10px 16px',
                alignItems: 'center',
              }}
              onClick={() => {
                reset({
                  accountSid: '',
                  apiKeySid: '',
                  apiKeySecret: '',
                  messagingServiceSid: '',
                  isDisabled: false,
                })
                mutateFormTwilioDeletion.mutate()
                onClose()
              }}
            >
              Yes, remove Twilio credentials
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
