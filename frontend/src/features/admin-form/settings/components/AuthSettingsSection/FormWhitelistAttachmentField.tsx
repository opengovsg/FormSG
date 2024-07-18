import { useCallback, useMemo, useState } from 'react'
import {
  Controller,
  ControllerRenderProps,
  FormProvider,
  useForm,
} from 'react-hook-form'
import { Box, Skeleton } from '@chakra-ui/react'

import { MB } from '~shared/constants'
import { AttachmentSize, BasicField, StorageFormSettings } from '~shared/types'
import { VALID_WHITELIST_FILE_EXTENSIONS } from '~shared/utils/file-validation'

import Attachment from '~components/Field/Attachment'
import { AttachmentFieldSchema } from '~templates/Field'
import { FieldContainer } from '~templates/Field/FieldContainer'

import { SecretKeyDownloadWhitelistFileModal } from './SecretKeyDownloadWhitelistFileModal'

interface FormWhitelistAttachmentFieldProps {
  settings: StorageFormSettings
  isDisabled: boolean
}

export const FormWhitelistAttachmentField = ({
  settings,
  isDisabled,
}: FormWhitelistAttachmentFieldProps): JSX.Element => {
  const [isLoading] = useState(false)
  const [isSecretKeyModalOpen, setIsSecretKeyModalOpen] = useState(false)
  const methods = useForm()
  const { control, setValue, setError } = methods
  const fieldContainerSchema: AttachmentFieldSchema = {
    _id: 'whitelist-csv-attachment-field-container',
    title: 'Restrict form to eligible NRIC/FIN/UEN',
    description:
      'Only NRIC/FIN/UENs in this list are allowed to submit a response. CSV file must include a “Respondent” column with all whitelisted NRIC/FIN/UENs. ' +
      '[Download a sample .csv file](https://go.gov.sg/formsg-whitelist-respondents-sample-csv)',
    required: true,
    disabled: isDisabled,
    fieldType: BasicField.Attachment,
    attachmentSize: AttachmentSize.TwentyMb,
  }

  const { publicKey } = settings

  const maxSizeInBytes = useMemo(() => {
    if (!fieldContainerSchema.attachmentSize) {
      return
    }
    return parseInt(fieldContainerSchema.attachmentSize) * MB
  }, [fieldContainerSchema.attachmentSize])

  const setWhitelistAttachmentFieldError = useCallback(
    (errMsg: string) => {
      setError(fieldContainerSchema._id, {
        type: 'manual',
        message: errMsg,
      })
    },
    [setError, fieldContainerSchema._id],
  )

  const onFileSelect = useCallback(
    (onChange: ControllerRenderProps['onChange']) => {
      return (file: File | null) => {
        if (!file) {
          return
        }

        // TODO: Handle uploading the file to backend
        setWhitelistAttachmentFieldError('Error uploading whitelist file')
        onChange(file)
      }
    },
    [setWhitelistAttachmentFieldError],
  )

  const triggerSecretKeyInputTransition = useCallback(() => {
    setIsSecretKeyModalOpen(true)
  }, [])

  const removeWhitelist = useCallback(() => {
    setValue('whitelist-csv-attachment-field', null)

    // TODO: set the whitelist to null in the backend
  }, [setValue])

  return (
    <>
      <SecretKeyDownloadWhitelistFileModal
        isOpen={isSecretKeyModalOpen}
        onClose={() => setIsSecretKeyModalOpen(false)}
        publicKey={publicKey}
      />
      <Box opacity={isDisabled ? 0.3 : 1}>
        <FormProvider {...methods}>
          <FieldContainer schema={fieldContainerSchema}>
            <Controller
              name="whitelist-csv-attachment-field"
              control={control}
              render={({ field: { onChange, name, value } }) => (
                <Skeleton isLoaded={!isLoading}>
                  <Attachment
                    name={name}
                    value={value}
                    onChange={onFileSelect(onChange)}
                    onError={setWhitelistAttachmentFieldError}
                    handleDownloadFileOverride={triggerSecretKeyInputTransition}
                    handleRemoveFileOverride={removeWhitelist}
                    showFileSize
                    maxSize={maxSizeInBytes}
                    showDownload
                    showRemove
                    isDownloadDisabled={false}
                    isRemoveDisabled={isDisabled}
                    disabled={isDisabled}
                    accept={VALID_WHITELIST_FILE_EXTENSIONS}
                  />
                </Skeleton>
              )}
            />
          </FieldContainer>
        </FormProvider>
      </Box>
    </>
  )
}
