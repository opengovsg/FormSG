import { useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { BiRightArrowAlt, BiUpload } from 'react-icons/bi'
import { useQueryClient } from 'react-query'
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
import Papa from 'papaparse'

import {
  decryptStringMessage,
  EncryptedStringsMessageContent,
} from '~shared/utils/crypto'

import { useToast } from '~hooks/useToast'
import { isKeypairValid, SECRET_KEY_REGEX } from '~utils/secretKeyValidation'
import Button from '~components/Button'
import { downloadFile } from '~components/Field/Attachment/utils/downloadFile'
import { FormErrorMessage } from '~components/FormControl/FormErrorMessage/FormErrorMessage'
import IconButton from '~components/IconButton'
import Input from '~components/Input'

import { fetchAdminFormEncryptedWhitelistedSubmitterIds } from '../../queries'
import { FormActivationSvg } from '../FormActivationSvg'

export interface SecretKeyDownloadWhitelistFileModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  publicKey: string
  formId: string
  downloadFileName: string
}

const SECRET_KEY_NAME = 'secretKey'

interface SecretKeyFormInputs {
  [SECRET_KEY_NAME]: string
}

const useSecretKeyWhitelistFileModal = ({
  publicKey,
  onClose,
  formId,
  downloadFileName,
}: Pick<
  SecretKeyDownloadWhitelistFileModalProps,
  'publicKey' | 'onClose' | 'formId' | 'downloadFileName'
>) => {
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })
  const errorToast = useToast({ status: 'danger', isClosable: true })
  const {
    formState: { errors },
    setError,
    setValue,
    register,
    handleSubmit,
    reset,
    watch,
  } = useForm<SecretKeyFormInputs>()

  const handleError = useCallback(
    (error: Error) => {
      errorToast.closeAll()
      errorToast({
        description: error.message,
      })
    },
    [errorToast],
  )

  const fileUploadRef = useRef<HTMLInputElement | null>(null)

  const decryptSubmitterIds = useCallback(
    (
      encryptedSubmitterIdContent: EncryptedStringsMessageContent,
      secretKey: string,
    ) => {
      return decryptStringMessage(secretKey, encryptedSubmitterIdContent)
    },
    [],
  )

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
      fetchAdminFormEncryptedWhitelistedSubmitterIds(formId, queryClient)
        .then((data) => {
          const { encryptedWhitelistedSubmitterIds } = data
          if (
            encryptedWhitelistedSubmitterIds &&
            encryptedWhitelistedSubmitterIds.myPublicKey &&
            encryptedWhitelistedSubmitterIds.nonce &&
            encryptedWhitelistedSubmitterIds.cipherTexts &&
            encryptedWhitelistedSubmitterIds.cipherTexts.length > 0
          ) {
            const decryptedSubmitterIds = decryptSubmitterIds(
              encryptedWhitelistedSubmitterIds,
              secretKey,
            )
            const submitterIds = decryptedSubmitterIds.filter(
              (id) => id !== null,
            )
            if (!submitterIds || submitterIds.length === 0) {
              return
            }

            // generate and download csv file
            const csvData = submitterIds.map((submitterId) => ({
              Respondent: submitterId,
            }))
            const csvString = Papa.unparse(csvData, {
              header: true,
              delimiter: ',',
              skipEmptyLines: 'greedy',
            })
            const csvBlob = new Blob([csvString], {
              type: 'text/csv',
            })
            const csvFile = new File([csvBlob], downloadFileName, {
              type: 'text/csv',
            })
            downloadFile(csvFile)

            handleFormClose()
            toast.closeAll()
            toast({
              description: 'Whitelist setting file downloaded successfully',
            })
          } else {
            errorToast.closeAll()
            errorToast({
              description: 'Whitelist settings could not be decrypted',
            })
          }
        })
        .catch(handleError)
    },
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
  downloadFileName,
  formId,
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
    handleSubmit,
    handleFileSelect,
    handleOnClose,
    isSecretKeyUploaded,
  } = useSecretKeyWhitelistFileModal({
    publicKey,
    onClose,
    formId,
    downloadFileName,
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
          <Container maxW="42.5rem">
            Download whitelisted NRIC/FIN/UEN .csv file
          </Container>
        </ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Container maxW="42.5rem">
            <FormActivationSvg mb="2rem" />
            <form onSubmit={handleSubmit} noValidate>
              <FormControl isRequired isInvalid={!!errors.secretKey} mb="1rem">
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
