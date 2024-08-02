import { useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { isKeypairValid, SECRET_KEY_REGEX } from '~utils/secretKeyValidation'

export const SECRET_KEY_NAME = 'secretKey'
export const ACK_NAME = 'ack'
export interface SecretKeyFormInputs {
  [SECRET_KEY_NAME]: string
  [ACK_NAME]?: boolean
}

export interface UseSecretKeyFormProps {
  publicKey: string
  onSecretKeyFormSubmit: ({ secretKey, ack }: SecretKeyFormInputs) => void
  onClose: () => void
  hasAck: boolean
}

/**
 * Reusable hook for secret key form logic.
 * Handles validation of secret key and supports various secret key selection methods such as file upload.
 */
export const useSecretKeyForm = ({
  publicKey,
  onClose,
  onSecretKeyFormSubmit,
  hasAck = false,
}: UseSecretKeyFormProps) => {
  const {
    formState: { errors },
    setError,
    setValue,
    register,
    reset,
    watch,
    handleSubmit,
  } = useForm<SecretKeyFormInputs>()

  const watchedSecretKey = watch(SECRET_KEY_NAME)
  const watchedAck = watch(ACK_NAME)

  const isSecretKeyUploaded = !!watchedSecretKey

  const isSecretKeyFormCompleted =
    !!watchedSecretKey && (!hasAck || !!watchedAck)

  const secretKeyFileUploadRef = useRef<HTMLInputElement | null>(null)

  const handleVerifyKeyPairAndSubmit = handleSubmit(
    ({ secretKey, ack }: SecretKeyFormInputs) => {
      if (!isKeypairValid(publicKey, secretKey)) {
        return setError(
          SECRET_KEY_NAME,
          {
            type: 'invalidKey',
            message: 'The secret key provided is invalid',
          },
          { shouldFocus: true },
        )
      }

      onSecretKeyFormSubmit({ secretKey, ack })
    },
  )

  const handleSecretKeyFileChange = useCallback(
    ({ target }: React.ChangeEvent<HTMLInputElement>) => {
      const file = target.files?.[0]
      // Reset file input so the same file selected will trigger this onChange
      // function.
      if (secretKeyFileUploadRef.current) {
        secretKeyFileUploadRef.current.value = ''
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
  const handleSecretKeyFormClose = useCallback(() => {
    reset()
    return onClose()
  }, [onClose, reset])

  return {
    secretKeyFileUploadRef,
    handleSecretKeyFileChange,
    handleVerifyKeyPairAndSubmit,
    handleSecretKeyFormClose,
    isSecretKeyUploaded,
    isSecretKeyFormCompleted,
    register,
    errors,
  }
}
