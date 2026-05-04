import { useTranslation } from 'react-i18next'
import { BiRightArrowAlt, BiUpload } from 'react-icons/bi'
import {
  Container,
  FormControl,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Stack,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { SECRET_KEY_REGEX } from '~utils/secretKeyValidation'
import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import IconButton from '~components/IconButton'
import Input from '~components/Input'
import { ModalCloseButton } from '~components/Modal'

import {
  ACK_NAME,
  SECRET_KEY_NAME,
  SecretKeyFormInputs,
  useSecretKeyForm,
} from '../hooks/useSecretKeyForm'

import { FormActivationSvg } from './FormActivationSvg'

export interface SecretKeyFormModalProps extends Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
> {
  isLoading: boolean
  publicKey: string
  modalActionText: string
  submitButtonText: string
  onSubmit: (secretKeyFormInputs: SecretKeyFormInputs) => void
  hasAck?: boolean
}

export const SecretKeyFormModal = ({
  isLoading,
  onClose,
  isOpen,
  publicKey,
  modalActionText,
  submitButtonText,
  onSubmit,
  hasAck = false,
}: SecretKeyFormModalProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    fieldLabel,
    uploadFromFileAriaLabel,
    validation: {
      required: requiredSecretKeyMessage,
      invalidSecretKey: invalidSecretKeyMessage,
    },
    placeholder: { dragging: draggingPlaceholder, default: defaultPlaceholder },
    ackLabel,
  } = t('features.adminForm.settings.secretKeyModal', { returnObjects: true })

  const {
    dragging,
    errors,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleSecretKeyFileChange,
    handleSecretKeyFormClose,
    handleVerifyKeyPairAndSubmit,
    isSecretKeyFormCompleted,
    isSecretKeyUploaded,
    register,
    secretKeyFileUploadRef,
  } = useSecretKeyForm({
    publicKey,
    onClose,
    onSubmit,
    hasAck,
  })

  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })

  return (
    <Modal isOpen={isOpen} onClose={handleSecretKeyFormClose} size={modalSize}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <ModalCloseButton />
        {/* Hidden input field to trigger file selector, can be anywhere in the DOM */}
        <Input
          name="secretKeyFile"
          ref={secretKeyFileUploadRef}
          type="file"
          accept="text/plain"
          onChange={handleSecretKeyFileChange}
          display="none"
        />
        <ModalHeader color="secondary.500">
          <Container maxW="42.5rem">{modalActionText}</Container>
        </ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Container maxW="42.5rem">
            <FormActivationSvg mb="2rem" />
            <form onSubmit={handleVerifyKeyPairAndSubmit} noValidate>
              <FormControl
                isRequired
                isInvalid={!!errors.secretKey}
                mb="1rem"
                isDisabled={isLoading}
              >
                <FormLabel>{fieldLabel}</FormLabel>
                <Stack direction="row" spacing="0.5rem">
                  <Input
                    type="password"
                    {...register(SECRET_KEY_NAME, {
                      required: requiredSecretKeyMessage,
                      pattern: {
                        value: SECRET_KEY_REGEX,
                        message: invalidSecretKeyMessage,
                      },
                      setValueAs: (v) => v.trim(),
                    })}
                    placeholder={
                      dragging ? draggingPlaceholder : defaultPlaceholder
                    }
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                  <IconButton
                    isDisabled={isLoading}
                    variant="outline"
                    aria-label={uploadFromFileAriaLabel}
                    icon={<BiUpload />}
                    onClick={() => secretKeyFileUploadRef.current?.click()}
                  />
                </Stack>
                <FormErrorMessage>{errors.secretKey?.message}</FormErrorMessage>
              </FormControl>
              {hasAck ? (
                <FormControl hidden={!isSecretKeyUploaded} mb="1.25rem">
                  <Checkbox
                    isDisabled={isLoading}
                    isInvalid={!!errors.ack}
                    {...register(ACK_NAME, {
                      required: true,
                    })}
                  >
                    {ackLabel}
                  </Checkbox>
                </FormControl>
              ) : null}
              <Button
                rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
                type="submit"
                isFullWidth
                hidden={!isSecretKeyUploaded}
                isDisabled={!isSecretKeyFormCompleted}
                isLoading={isLoading}
              >
                {submitButtonText}
              </Button>
            </form>
          </Container>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
