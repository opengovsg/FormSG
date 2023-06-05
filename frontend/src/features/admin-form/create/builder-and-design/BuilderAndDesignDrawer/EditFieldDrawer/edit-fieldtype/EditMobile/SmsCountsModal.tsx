import { useParams } from 'react-router-dom'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import { SmsCountsDto } from '~shared/types/form'

import { ADMINFORM_ROUTE, ADMINFORM_SETTINGS_SUBROUTE } from '~constants/routes'
import { useIsMobile } from '~hooks/useIsMobile'
import Badge from '~components/Badge'
import Button from '~components/Button'
import Link from '~components/Link'
import Spinner from '~components/Spinner'

import { formatSmsCounts } from './utils'

type SmsCountsModalProps = {
  freeSmsCount?: SmsCountsDto
  isOpen: boolean
  onClose: () => void
}
export const SmsCountsModal = ({
  freeSmsCount,
  isOpen,
  onClose,
}: SmsCountsModalProps) => {
  const { formId } = useParams()

  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  const isMobile = useIsMobile()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      closeOnEsc={false}
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Verified SMS Billing</ModalHeader>
        <ModalBody>
          {freeSmsCount === undefined ? (
            <Spinner fontSize="2rem" />
          ) : (
            <>
              <Text textStyle="body-2">
                Form provides {`${freeSmsCount.quota.toLocaleString()}`} free
                SMS OTP verifications per account, for forms you are an owner
                of. Once this limit is reached, SMS OTP verification will be
                automatically disabled for all owned forms. Forms with Twilio
                already set up will not be affected.
              </Text>
              <Text textStyle="body-2" mt="1.5rem">
                If you are a collaborator, ensure the form's owner has enough
                free verifications. If you require more than{' '}
                {`${freeSmsCount.quota.toLocaleString()}`} verifications, please{' '}
                <Link
                  href={`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_SETTINGS_SUBROUTE}`}
                >
                  add your Twilio credentials.
                </Link>
              </Text>
              <Badge
                colorScheme="primary"
                variant="subtle"
                color="secondary.500"
                mt="2rem"
              >
                {formatSmsCounts(freeSmsCount)}
              </Badge>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button isFullWidth={isMobile} onClick={onClose}>
            Yes, I understand
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
