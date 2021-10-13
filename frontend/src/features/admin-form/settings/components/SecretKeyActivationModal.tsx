/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { BiUpload } from 'react-icons/bi'
import {
  Container,
  FormControl,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  Stack,
  Text,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import formsgSdk from '~utils/formSdk'
import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import IconButton from '~components/IconButton'
import Input from '~components/Input'

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

export const SecretKeyActivationModal = ({
  onClose,
  isOpen,
  publicKey,
}: SecretKeyActivationModalProps): JSX.Element => {
  const {
    formState: { errors },
    setError,
    register,
    setValue,
    handleSubmit,
  } = useForm<SecretKeyFormInputs>()

  const fileUploadRef = useRef<HTMLInputElement | null>(null)

  const verifyKeypair = handleSubmit(({ secretKey }) => {
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalContent>
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
        <ModalBody whiteSpace="pre-line">
          <Container maxW="42.5rem">
            <form onSubmit={verifyKeypair} noValidate>
              <Text as="h1" textStyle="h2" color="secondary.500">
                Activate your form
              </Text>
              <FormControl isRequired isInvalid={!!errors.secretKey} mb="1rem">
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
                    variant="outline"
                    aria-label="Pass secret key from file"
                    icon={<BiUpload />}
                    onClick={() => fileUploadRef.current?.click()}
                  />
                </Stack>
                <FormErrorMessage>{errors.secretKey?.message}</FormErrorMessage>
              </FormControl>
              <FormControl mb="1.25rem">
                <Checkbox
                  isInvalid={!!errors.ack}
                  {...register('ack', {
                    required: true,
                  })}
                >
                  If I lose my key, I will not be able to activate my form and
                  all my responses will be lost permanently.
                </Checkbox>
              </FormControl>
              <Button type="submit" isFullWidth>
                Activate form
              </Button>
            </form>
          </Container>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
