import { useCallback, useState } from 'react'
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
  Text,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { FormStatus } from 'formsg-shared/types/form/form'

import { SECRET_KEY_REGEX } from '~utils/secretKeyValidation'
import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import IconButton from '~components/IconButton'
import Input from '~components/Input'
import { ModalCloseButton } from '~components/Modal'

import {
  FormOriginValue,
  OriginSelection,
} from '~features/workspace/components/CreateFormFlowV2/OriginSelection'
import {
  StepCard,
  type StepStatus,
} from '~features/workspace/components/CreateFormFlowV2/StepCard'

import {
  ACK_NAME,
  SECRET_KEY_NAME,
  useSecretKeyForm,
} from '../hooks/useSecretKeyForm'
import { useMutateFormSettings } from '../mutations'

export interface SecretKeyActivationModalProps extends Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
> {
  publicKey: string
}

export const SecretKeyActivationModal = ({
  onClose,
  isOpen,
  publicKey,
}: SecretKeyActivationModalProps): JSX.Element => {
  return (
    <SecretKeyActivationWithOriginModal
      onClose={onClose}
      isOpen={isOpen}
      publicKey={publicKey}
    />
  )
}

const SecretKeyActivationWithOriginModal = ({
  onClose,
  isOpen,
  publicKey,
}: SecretKeyActivationModalProps): JSX.Element => {
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
  const { submitButton } = t(
    'features.adminForm.settings.secretKeyModal.activation',
    { returnObjects: true },
  )

  const { mutateFormStatus } = useMutateFormSettings()

  const [originSelected, setOriginSelected] = useState<FormOriginValue[]>([])
  const [othersText, setOthersText] = useState('')

  const handleSubmit = useCallback(() => {
    // TODO: persist origin data to form metadata via API
    return mutateFormStatus.mutate(FormStatus.Public, { onSuccess: onClose })
  }, [mutateFormStatus, onClose])

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
    onSubmit: handleSubmit,
    hasAck: true,
  })

  const isOriginValid =
    originSelected.length > 0 &&
    (!originSelected.includes('others') || othersText.trim().length > 0)

  const step1Status: StepStatus = isSecretKeyFormCompleted ? 'done' : 'active'
  const step2Status: StepStatus = !isSecretKeyFormCompleted
    ? 'pending'
    : isOriginValid
      ? 'done'
      : 'active'

  const isActivateEnabled = isSecretKeyFormCompleted && isOriginValid

  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })

  return (
    <Modal isOpen={isOpen} onClose={handleSecretKeyFormClose} size={modalSize}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <ModalCloseButton />
        <Input
          name="secretKeyFile"
          ref={secretKeyFileUploadRef}
          type="file"
          accept="text/plain"
          onChange={handleSecretKeyFileChange}
          display="none"
        />
        <ModalHeader color="secondary.500">
          <Container maxW="42.5rem">Activate your form</Container>
        </ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Container maxW="42.5rem">
            <Stack spacing="2rem">
              {/* Step 1: Enter Secret Key */}
              <StepCard
                status={step1Status}
                stepNumber={1}
                title="Enter or upload Secret Key"
              >
                <form onSubmit={handleVerifyKeyPairAndSubmit} noValidate>
                  <FormControl
                    isRequired
                    isInvalid={!!errors.secretKey}
                    mb="1rem"
                    isDisabled={mutateFormStatus.isLoading}
                  >
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
                        isDisabled={mutateFormStatus.isLoading}
                        variant="outline"
                        aria-label={uploadFromFileAriaLabel}
                        icon={<BiUpload />}
                        onClick={() => secretKeyFileUploadRef.current?.click()}
                      />
                    </Stack>
                    <FormErrorMessage>
                      {errors.secretKey?.message}
                    </FormErrorMessage>
                  </FormControl>
                  {isSecretKeyUploaded && (
                    <FormControl mb="0">
                      <Checkbox
                        isDisabled={mutateFormStatus.isLoading}
                        isInvalid={!!errors.ack}
                        {...register(ACK_NAME, {
                          required: true,
                        })}
                      >
                        {ackLabel}
                      </Checkbox>
                    </FormControl>
                  )}
                </form>
              </StepCard>

              {/* Step 2: Origin tracking */}
              <StepCard
                status={step2Status}
                stepNumber={2}
                title="What was this form before?"
              >
                <Stack spacing="0.75rem">
                  <Text textStyle="body-2" color="secondary.400">
                    Select all that apply.
                  </Text>
                  <OriginSelection
                    selected={originSelected}
                    onSelectionChange={setOriginSelected}
                    othersText={othersText}
                    onOthersTextChange={setOthersText}
                  />
                </Stack>
              </StepCard>
            </Stack>

            {/* Activate button */}
            <Button
              mt="1.5rem"
              rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
              isFullWidth
              isDisabled={!isActivateEnabled}
              isLoading={mutateFormStatus.isLoading}
              onClick={handleSubmit}
            >
              {submitButton}
            </Button>
          </Container>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
