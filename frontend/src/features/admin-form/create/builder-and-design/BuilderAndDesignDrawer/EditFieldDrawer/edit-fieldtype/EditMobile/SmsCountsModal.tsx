import { useTranslation } from 'react-i18next'
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
  smsCount?: SmsCountsDto
  isOpen: boolean
  onClose: () => void
}
export const SmsCountsModal = ({
  smsCount,
  isOpen,
  onClose,
}: SmsCountsModalProps) => {
  const { t } = useTranslation()
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
          {smsCount === undefined ? (
            <Spinner fontSize="2rem" />
          ) : (
            <>
              <Text textStyle="body-2">
                FormSG provides {`${smsCount.quota.toLocaleString()}`} free OTP
                verifications per account, for forms you are an owner of. Once
                this limit is reached, your form will automatically be closed.
              </Text>
              <Text textStyle="body-2" mt="1.5rem">
                If you are a collaborator, ensure the form's owner has enough
                free verifications. If you require more than{' '}
                {`${smsCount.quota.toLocaleString()}`} verifications, please{' '}
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
                {`${formatSmsCounts(smsCount)} ${t(
                  'features.adminForm.sidebar.fields.mobileNo.otpVerification.smsUsed',
                )}`}
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
