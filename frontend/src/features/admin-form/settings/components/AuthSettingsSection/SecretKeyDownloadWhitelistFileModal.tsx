import { useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { BiRightArrowAlt, BiUpload } from 'react-icons/bi'
import {
  Container,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  Stack,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { isKeypairValid, SECRET_KEY_REGEX } from '~utils/secretKeyValidation'
import Button from '~components/Button'
import { FormErrorMessage } from '~components/FormControl/FormErrorMessage/FormErrorMessage'
import IconButton from '~components/IconButton'
import Input from '~components/Input'

import { FormActivationSvg } from '../FormActivationSvg'

export interface SecretKeyDownloadWhitelistFileModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  publicKey: string
}
const SECRET_KEY_NAME = 'secretKey'

interface SecretKeyFormInputs {
  [SECRET_KEY_NAME]: string
}

const useSecretKeyWhitelistFileModal = ({
  publicKey,
  onClose,
}: Pick<SecretKeyDownloadWhitelistFileModalProps, 'publicKey' | 'onClose'>) => {
  const {
    formState: { errors },
    setError,
    setValue,
    register,
    handleSubmit,
    reset,
    watch,
  } = useForm<SecretKeyFormInputs>()

  const fileUploadRef = useRef<HTMLInputElement | null>(null)

  const verifyKeyPairAndDownloadWhitelistFile = handleSubmit(
    ({ secretKey }) => {
      const isValid = isKeypairValid(publicKey, secretKey)

      if (!isValid) {
        return setError(
          SECRET_KEY_NAME,
          {
            type: 'manual',
            message: 'The secret key provided is invalid',
          },
          {
            shouldFocus: true,
          },
        )
      }
    },

    // TODO: Download the whitelist file
  )

  const readValidateSetSecretKeyFormFieldFromFile = useCallback(
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
  const handleFormClose = useCallback(() => {
    reset()
    return onClose()
  }, [onClose, reset])

  const isSecretKeyUploaded = !!watch(SECRET_KEY_NAME)

  return {
    register,
    errors,
    fileUploadRef,
    isLoading: false, // TODO: Add loading state based on the pulling of file
    handleSubmit: verifyKeyPairAndDownloadWhitelistFile,
    handleFileSelect: readValidateSetSecretKeyFormFieldFromFile,
    handleOnClose: handleFormClose,
    isSecretKeyUploaded,
  }
}

export const SecretKeyDownloadWhitelistFileModal = ({
  onClose,
  isOpen,
  publicKey,
}: SecretKeyDownloadWhitelistFileModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })

  const {
    errors,
    register,
    fileUploadRef,
    isLoading,
    handleSubmit,
    handleFileSelect,
    handleOnClose,
    isSecretKeyUploaded,
  } = useSecretKeyWhitelistFileModal({ publicKey, onClose })

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
          <Container maxW="42.5rem">
            Download whitelisted NRIC/FIN/UEN .csv file
          </Container>
        </ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Container maxW="42.5rem">
            <FormActivationSvg mb="2rem" />
            <form onSubmit={handleSubmit} noValidate>
              <FormControl
                isRequired
                isInvalid={!!errors.secretKey}
                mb="1rem"
                isDisabled={isLoading}
              >
                <FormLabel>Enter or upload Secret Key</FormLabel>
                <Stack direction="row" spacing="0.5rem">
                  <Input
                    type="password"
                    {...register(SECRET_KEY_NAME, {
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
              <Button
                rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
                type="submit"
                isFullWidth
                isDisabled={!isSecretKeyUploaded}
                isLoading={isLoading}
              >
                Download
              </Button>
            </form>
          </Container>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
