import { useCallback, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
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

import { FormStatus } from '~shared/types/form/form'

import formsgSdk from '~utils/formSdk'
import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import IconButton from '~components/IconButton'
import Input from '~components/Input'
import { ModalCloseButton } from '~components/Modal'

import { useMutateFormSettings } from '../mutations'

import { FormActivationSvg } from './FormActivationSvg'

export interface SecretKeyActivationModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  publicKey: string
}

const SECRET_KEY_NAME = 'secretKey'
const SECRET_KEY_REGEX = /^[a-zA-Z0-9/+]+={0,2}$/

interface SecretKeyFormInputs {
  [SECRET_KEY_NAME]: string
  ack: boolean
}

const useSecretKeyActivationModal = ({
  publicKey,
  onClose,
}: Pick<SecretKeyActivationModalProps, 'publicKey' | 'onClose'>) => {
  const {
    formState: { errors },
    setError,
    register,
    watch,
    setValue,
    reset,
    handleSubmit,
  } = useForm<SecretKeyFormInputs>()

  const fileUploadRef = useRef<HTMLInputElement | null>(null)

  const { mutateFormStatus } = useMutateFormSettings()

  const handleVerifyKeypair = handleSubmit(({ secretKey }) => {
    const trimmedSecretKey = secretKey.trim()
    const isKeypairValid = formsgSdk.crypto.valid(publicKey, trimmedSecretKey)

    if (!isKeypairValid) {
      return setError(
        SECRET_KEY_NAME,
        {
          type: 'invalidKey',
          message: 'The secret key provided is invalid',
        },
        { shouldFocus: true },
      )
    }

    // Valid, process to activate form.
    return mutateFormStatus.mutate(FormStatus.Public, { onSuccess: onClose })
  })

  const handleFileSelect = useCallback(
    ({ target }: React.ChangeEvent<HTMLInputElement>) => {
      const file = target.files?.[0]
      // Reset file input so the same file selected will trigger this onChange
      // function.
      if (fileUploadRef.current) {
        fileUploadRef.current.value = ''
      }

      if (!file) return

      const reader = new FileReader()
      reader.onload = async (e) => {
        if (!e.target) return
        const text = e.target.result?.toString()

        if (!text || !SECRET_KEY_REGEX.test(text)) {
          return setError(
            SECRET_KEY_NAME,
            {
              type: 'invalidFile',
              message: 'Selected file seems to be invalid',
            },
            { shouldFocus: true },
          )
        }

        setValue(SECRET_KEY_NAME, text, { shouldValidate: true })
      }
      reader.readAsText(file)
    },
    [setError, setValue],
  )

  // Reset form before closing.
  const handleOnClose = useCallback(() => {
    reset()
    return onClose()
  }, [onClose, reset])

  const watchedSecretKey = watch(SECRET_KEY_NAME)
  const watchedAck = watch('ack')

  const secretKeyNotUploaded = useMemo(
    () => !watchedSecretKey,
    [watchedSecretKey],
  )

  const activateDisabled = useMemo(
    () => !watchedSecretKey || !watchedAck,
    [watchedSecretKey, watchedAck],
  )

  return {
    fileUploadRef,
    handleFileSelect,
    handleVerifyKeypair,
    register,
    secretKeyNotUploaded,
    activateDisabled,
    errors,
    isLoading: mutateFormStatus.isLoading,
    handleOnClose,
  }
}

export const SecretKeyActivationModal = ({
  onClose,
  isOpen,
  publicKey,
}: SecretKeyActivationModalProps): JSX.Element => {
  const {
    fileUploadRef,
    handleFileSelect,
    handleVerifyKeypair,
    register,
    secretKeyNotUploaded,
    activateDisabled,
    errors,
    isLoading,
    handleOnClose,
  } = useSecretKeyActivationModal({ publicKey, onClose })

  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })

  return (
    <Modal isOpen={isOpen} onClose={handleOnClose} size={modalSize}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <ModalCloseButton />
        {/* Hidden input field to trigger file selector, can be anywhere in the DOM */}
        <Input
          name="secretKeyFile"
          ref={fileUploadRef}
          type="file"
          accept="text/plain"
          onChange={handleFileSelect}
          display="none"
        />
        <ModalHeader color="secondary.500">
          <Container maxW="42.5rem">Activate your form</Container>
        </ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Container maxW="42.5rem">
            <FormActivationSvg mb="2rem" />
            <form onSubmit={handleVerifyKeypair} noValidate>
              <FormControl
                isRequired
                isInvalid={!!errors.secretKey}
                mb="1rem"
                isDisabled={isLoading}
              >
                <FormLabel>Enter or upload Secret Key</FormLabel>
                <Stack direction="row" spacing="0.5rem">
                  <Input
                    {...register('secretKey', {
                      required: "Please enter the form's secret key",
                      pattern: {
                        value: SECRET_KEY_REGEX,
                        message: 'The secret key provided is invalid',
                      },
                    })}
                    placeholder="Enter or upload your Secret Key to continue"
                  />
                  <IconButton
                    isDisabled={isLoading}
                    variant="outline"
                    aria-label="Pass secret key from file"
                    icon={<BiUpload />}
                    onClick={() => fileUploadRef.current?.click()}
                  />
                </Stack>
                <FormErrorMessage>{errors.secretKey?.message}</FormErrorMessage>
              </FormControl>
              <FormControl hidden={secretKeyNotUploaded} mb="1.25rem">
                <Checkbox
                  isDisabled={isLoading}
                  isInvalid={!!errors.ack}
                  {...register('ack', {
                    required: true,
                  })}
                >
                  If I lose my key, I will not be able to activate my form and
                  all my responses will be lost permanently
                </Checkbox>
              </FormControl>
              <Button
                rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
                type="submit"
                isFullWidth
                hidden={secretKeyNotUploaded}
                isDisabled={activateDisabled}
                isLoading={isLoading}
              >
                Activate form
              </Button>
            </form>
          </Container>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
