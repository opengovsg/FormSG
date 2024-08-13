import { useCallback, useRef, useState } from 'react'
import { useForm, UseFormSetError, UseFormSetValue } from 'react-hook-form'

import { isKeypairValid, SECRET_KEY_REGEX } from '~utils/secretKeyValidation'

export const SECRET_KEY_NAME = 'secretKey'
export const ACK_NAME = 'ack'
export interface SecretKeyFormInputs {
  [SECRET_KEY_NAME]: string
  [ACK_NAME]?: boolean
}

export interface UseSecretKeyFormProps {
  publicKey: string
  onSubmit: ({ secretKey, ack }: SecretKeyFormInputs) => void
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
  onSubmit,
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

  const [dragging, setDragging] = useState(false)

  const preventDefaults = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

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

      onSubmit({ secretKey, ack })
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

      processFile(file, setError, setValue)
    },
    [setError, setValue],
  )

  // Reset form before closing.
  const handleSecretKeyFormClose = useCallback(() => {
    reset()
    return onClose()
  }, [onClose, reset])

  return {
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
  }
}
