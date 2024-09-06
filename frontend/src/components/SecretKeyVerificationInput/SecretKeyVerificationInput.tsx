import { useCallback, useMemo, useRef, useState } from 'react'
import {
  RegisterOptions,
  useForm,
  UseFormSetError,
  UseFormSetValue,
} from 'react-hook-form'
import { BiUpload } from 'react-icons/bi'
import {
  FormControl,
  FormErrorMessage,
  IconButton,
  Input,
  Skeleton,
  Stack,
} from '@chakra-ui/react'

import { GUIDE_SECRET_KEY_LOSS } from '~constants/links'
import { useIsMobile } from '~hooks/useIsMobile'
import { isKeypairValid, SECRET_KEY_REGEX } from '~utils/secretKeyValidation'

import Button from '../Button'
import FormLabel from '../FormControl/FormLabel'
import Link from '../Link'

const SECRET_KEY_NAME = 'secretKey'

export type SecretKeyVerificationInputProps = {
  publicKey: string | null
  setSecretKey: (secretKey: string) => void
  isLoading: boolean
  description: string
  isButtonFullWidth: boolean
  showGuideLink: boolean
  buttonText: string
  prefillSecretKey?: string
}

interface SecretKeyFormInputs {
  [SECRET_KEY_NAME]: string
}

export const SecretKeyVerificationInput = ({
  publicKey,
  setSecretKey,
  isLoading,
  description,
  isButtonFullWidth,
  showGuideLink,
  buttonText,
  prefillSecretKey,
}: SecretKeyVerificationInputProps) => {
  const isMobile = useIsMobile()

  const {
    formState: { errors },
    setError,
    register,
    setValue,
    handleSubmit,
  } = useForm<SecretKeyFormInputs>({
    defaultValues: { secretKey: prefillSecretKey },
  })

  const [dragging, setDragging] = useState(false)

  const fileUploadRef = useRef<HTMLInputElement | null>(null)

  const secretKeyValidationRules: RegisterOptions = useMemo(() => {
    return {
      required: "Please enter the form's secret key",
      validate: (secretKey: string) => {
        // Should not see this error message.
        if (!publicKey) return 'Unexpected form mode'

        const isValid = isKeypairValid(publicKey, secretKey)
        return isValid || 'The secret key provided is invalid'
      },
    }
  }, [publicKey])

  const handleVerifyKeypair = handleSubmit(({ secretKey }) => {
    return setSecretKey(secretKey.trim())
  })

  const processFile = (
    file: File,
    setError: UseFormSetError<SecretKeyFormInputs>,
    setValue: UseFormSetValue<SecretKeyFormInputs>,
  ) => {
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
  }

  const preventDefaults = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      preventDefaults(e)
      setDragging(false)

      const file = e.dataTransfer.files?.[0]
      if (!file) return

      processFile(file, setError, setValue)
    },
    [setError, setValue],
  )

  const handleDragEnter = (e: React.DragEvent) => {
    preventDefaults(e)
    setDragging(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    preventDefaults(e)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    preventDefaults(e)
    setDragging(false)
  }

  const handleFileSelect = useCallback(
    ({ target }: React.ChangeEvent<HTMLInputElement>) => {
      const file = target.files?.[0]
      // Reset file input so the same file selected will trigger this onChange
      // function.
      if (fileUploadRef.current) {
        fileUploadRef.current.value = ''
      }

      if (!file) return

      processFile(file, setError, setValue)
    },
    [setError, setValue],
  )

  return (
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
        <FormLabel description={description}>
          Enter or upload Secret Key
        </FormLabel>
        <Stack direction="row" spacing="0.5rem">
          <Skeleton isLoaded={!isLoading} w="100%">
            <Input
              data-testid="secretKey"
              type="password"
              isDisabled={isLoading}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              placeholder={
                dragging
                  ? 'Drop your Secret Key here'
                  : 'Enter or upload your Secret Key here to continue'
              }
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
        <Button
          isFullWidth={isMobile || isButtonFullWidth}
          isDisabled={isLoading}
          type="submit"
        >
          {buttonText}
        </Button>
        {showGuideLink && (
          <Link variant="standalone" isExternal href={GUIDE_SECRET_KEY_LOSS}>
            Can't find your Secret Key?
          </Link>
        )}
      </Stack>
    </form>
  )
}
