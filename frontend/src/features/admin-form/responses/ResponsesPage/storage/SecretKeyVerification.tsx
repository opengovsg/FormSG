import { useCallback, useMemo, useRef } from 'react'
import { RegisterOptions, useForm } from 'react-hook-form'
import { BiUpload } from 'react-icons/bi'
import {
  Container,
  FormControl,
  FormErrorMessage,
  IconButton,
  Input,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import simplur from 'simplur'

import { GUIDE_SECRET_KEY_LOSS } from '~constants/links'
import { useIsMobile } from '~hooks/useIsMobile'
import formsgSdk from '~utils/formSdk'
import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import Link from '~components/Link'

import { FormActivationSvg } from '~features/admin-form/settings/components/FormActivationSvg'

import { useStorageResponsesContext } from './StorageResponsesContext'

const SECRET_KEY_NAME = 'secretKey'
const SECRET_KEY_REGEX = /^[a-zA-Z0-9/+]+={0,2}$/

interface SecretKeyFormInputs {
  [SECRET_KEY_NAME]: string
}

const useSecretKeyVerification = () => {
  const { setSecretKey, formPublicKey, isLoading, totalResponsesCount } =
    useStorageResponsesContext()

  const {
    formState: { errors },
    setError,
    register,
    setValue,
    handleSubmit,
  } = useForm<SecretKeyFormInputs>()

  const fileUploadRef = useRef<HTMLInputElement | null>(null)

  const secretKeyValidationRules: RegisterOptions = useMemo(() => {
    return {
      required: "Please enter the form's secret key",
      validate: (secretKey) => {
        // Should not see this error message.
        if (!formPublicKey) return 'This form is not a storage mode form'

        const trimmedSecretKey = secretKey.trim()
        const isKeypairValid =
          SECRET_KEY_REGEX.test(trimmedSecretKey) &&
          formsgSdk.crypto.valid(formPublicKey, trimmedSecretKey)

        return isKeypairValid || 'The secret key provided is invalid'
      },
    }
  }, [formPublicKey])

  const handleVerifyKeypair = handleSubmit(({ secretKey }) => {
    return setSecretKey(secretKey.trim())
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
        const text = e.target.result?.toString().trim()

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

  return {
    isLoading,
    totalResponsesCount,
    fileUploadRef,
    handleFileSelect,
    handleVerifyKeypair,
    secretKeyValidationRules,
    register,
    errors,
  }
}

export const SecretKeyVerification = (): JSX.Element => {
  const {
    isLoading,
    totalResponsesCount,
    fileUploadRef,
    handleVerifyKeypair,
    register,
    handleFileSelect,
    errors,
    secretKeyValidationRules,
  } = useSecretKeyVerification()

  const isMobile = useIsMobile()

  return (
    <Container p={0} maxW="42.5rem">
      <Stack spacing="2rem">
        <FormActivationSvg />
        <Skeleton isLoaded={!isLoading} w="fit-content">
          <Text as="h2" textStyle="h2" whiteSpace="pre-wrap">
            <Text color="primary.500" as="span">
              {totalResponsesCount?.toLocaleString() ?? '-'}
            </Text>
            {simplur` ${[totalResponsesCount ?? 0]}response[|s] to date`}
          </Text>
        </Skeleton>
        <form onSubmit={handleVerifyKeypair} noValidate>
          {/* Hidden input field to trigger file selector, can be anywhere in the DOM */}
          <Input
            name="secretKeyFile"
            ref={fileUploadRef}
            type="file"
            accept="text/plain"
            onChange={handleFileSelect}
            display="none"
          />
          <FormControl isRequired isInvalid={!!errors.secretKey} mb="1rem">
            <FormLabel description="Your Secret Key was downloaded when you created your form">
              Enter or upload Secret Key
            </FormLabel>
            <Stack direction="row" spacing="0.5rem">
              <Skeleton isLoaded={!isLoading} w="100%">
                <Input
                  isDisabled={isLoading}
                  {...register(SECRET_KEY_NAME, secretKeyValidationRules)}
                />
              </Skeleton>
              <Skeleton isLoaded={!isLoading}>
                <IconButton
                  isDisabled={isLoading}
                  variant="outline"
                  aria-label="Pass secret key from file"
                  icon={<BiUpload />}
                  onClick={() => fileUploadRef.current?.click()}
                />
              </Skeleton>
            </Stack>
            <FormErrorMessage>{errors.secretKey?.message}</FormErrorMessage>
          </FormControl>
          <Stack
            spacing={{ base: '1.5rem', md: '2rem' }}
            align="center"
            direction={{ base: 'column', md: 'row' }}
            mt="2rem"
          >
            <Button isFullWidth={isMobile} isDisabled={isLoading} type="submit">
              Unlock responses
            </Button>
            <Link variant="standalone" isExternal href={GUIDE_SECRET_KEY_LOSS}>
              Can't find your Secret Key?
            </Link>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}
