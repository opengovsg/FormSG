import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Controller,
  ControllerRenderProps,
  FormProvider,
  useForm,
} from 'react-hook-form'
import { useParams } from 'react-router'
import { Box, Skeleton } from '@chakra-ui/react'

import { MB } from '~shared/constants'
import { AttachmentSize, BasicField, StorageFormSettings } from '~shared/types'
import { VALID_WHITELIST_FILE_EXTENSIONS } from '~shared/utils/file-validation'

import { parseCsvFileToCsvString } from '~utils/parseCsvFileToCsvString'
import Attachment from '~components/Field/Attachment'
import { AttachmentFieldSchema } from '~templates/Field'
import { FieldContainer } from '~templates/Field/FieldContainer'

import { useMutateFormSettings } from '../../mutations'

import { SecretKeyDownloadWhitelistFileModal } from './SecretKeyDownloadWhitelistFileModal'

interface FormWhitelistAttachmentFieldProps {
  settings: StorageFormSettings
  isDisabled: boolean
}

const FormWhitelistAttachmentFieldContainerName =
  'whitelist-csv-attachment-field-container'
const FormWhitelistAttachmentFieldName = 'whitelist-csv-attachment-field'

export const FormWhitelistAttachmentField = ({
  settings,
  isDisabled,
}: FormWhitelistAttachmentFieldProps): JSX.Element => {
  const { mutateFormWhitelistSetting } = useMutateFormSettings()
  const { formId } = useParams()

  const isLoading = mutateFormWhitelistSetting.isLoading
  const [isSecretKeyModalOpen, setIsSecretKeyModalOpen] = useState(false)

  const methods = useForm()
  const { control, setValue, setError, clearErrors } = methods

  const standardCsvDownloadFileName = `whitelist_${formId}.csv`

  const fieldContainerSchema: AttachmentFieldSchema = {
    _id: FormWhitelistAttachmentFieldContainerName,
    title: 'Restrict form to eligible NRIC/FIN/UENs only',
    description:
      'Only NRIC/FIN/UENs in this list are allowed to submit a response. CSV file should include all whitelisted NRIC/FIN/UENs in a single column with the "Respondent" header. ' +
      '[Download a sample .csv file](https://go.gov.sg/formsg-whitelist-respondents-sample-csv)',
    required: true,
    disabled: isDisabled,
    fieldType: BasicField.Attachment,
    attachmentSize: AttachmentSize.TwentyMb,
  }

  const { publicKey, whitelistedSubmitterIds } = settings

  const isWhitelistEnabled = whitelistedSubmitterIds?.isWhitelistEnabled

  useEffect(() => {
    // Set the whitelist attachment field with a mock representation file
    // if whitelist is enabled so actual file can be lazily downloaded.
    if (isWhitelistEnabled) {
      setValue(FormWhitelistAttachmentFieldName, {
        name: standardCsvDownloadFileName,
        size: null,
        type: 'text/csv',
      })
    }
  }, [isWhitelistEnabled, setValue, standardCsvDownloadFileName])

  const maxSizeInBytes = useMemo(() => {
    if (!fieldContainerSchema.attachmentSize) {
      return
    }
    return parseInt(fieldContainerSchema.attachmentSize) * MB
  }, [fieldContainerSchema.attachmentSize])

  const setWhitelistAttachmentFieldError = useCallback(
    (errMsg: string) => {
      setError(FormWhitelistAttachmentFieldContainerName, {
        type: 'manual',
        message: errMsg,
      })
    },
    [setError],
  )

  const clearWhitelistAttachmentFieldError = useCallback(() => {
    clearErrors(FormWhitelistAttachmentFieldContainerName)
  }, [clearErrors])

  const onFileSelect = useCallback(
    (onChange: ControllerRenderProps['onChange']) => {
      return (file: File | null) => {
        if (!file) {
          return
        }

        const csvString = parseCsvFileToCsvString(file, (headerRow) => {
          return {
            isValid:
              headerRow &&
              headerRow.length === 1 &&
              headerRow[0].replace(/(\r\n|\n|\r)/gm, '').toLowerCase() ===
                'respondent',
            invalidReason:
              'Your CSV file should only contain a single column with the header "Respondent".',
          }
        })

        mutateFormWhitelistSetting.mutate(csvString, {
          onSuccess: () => {
            clearWhitelistAttachmentFieldError()
            onChange(file)
          },
          onError: (error) => {
            setWhitelistAttachmentFieldError(error.message)
          },
        })
      }
    },
    [
      setWhitelistAttachmentFieldError,
      clearWhitelistAttachmentFieldError,
      mutateFormWhitelistSetting,
    ],
  )

  const triggerSecretKeyInputTransition = useCallback(() => {
    setIsSecretKeyModalOpen(true)
  }, [])

  const removeWhitelist = useCallback(() => {
    mutateFormWhitelistSetting.mutate(null, {
      onSuccess: () => {
        setValue(FormWhitelistAttachmentFieldName, null)
      },
    })
  }, [setValue, mutateFormWhitelistSetting])

  return (
    <>
      <SecretKeyDownloadWhitelistFileModal
        isOpen={isSecretKeyModalOpen}
        onClose={() => setIsSecretKeyModalOpen(false)}
        publicKey={publicKey}
        formId={formId!}
        downloadFileName={standardCsvDownloadFileName}
      />
      <Box opacity={isDisabled ? 0.3 : 1}>
        <FormProvider {...methods}>
          <FieldContainer schema={fieldContainerSchema}>
            <Controller
              name={FormWhitelistAttachmentFieldName}
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
