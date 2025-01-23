import { useCallback, useEffect, useState } from 'react'
import {
  Controller,
  ControllerRenderProps,
  FormProvider,
  useForm,
} from 'react-hook-form'
import { useParams } from 'react-router'
import { Box, Skeleton } from '@chakra-ui/react'

import { KB } from '~shared/constants'
import { StorageFormSettings } from '~shared/types'
import { VALID_WHITELIST_FILE_EXTENSIONS } from '~shared/utils/file-validation'

import { parseCsvFile } from '~utils/parseCsvFile'
import Attachment from '~components/Field/Attachment'
import { BaseFieldProps, FieldContainer } from '~templates/Field/FieldContainer'

import { useMutateFormSettings } from '../../mutations'

import { SecretKeyDownloadWhitelistFileModal } from './SecretKeyDownloadWhitelistFileModal'

interface FormWhitelistAttachmentFieldProps {
  settings: StorageFormSettings
  isDisabled: boolean
}

const MAX_SIZE_IN_BYTES = 250 * KB
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

  const fieldContainerSchema: BaseFieldProps['schema'] = {
    _id: FormWhitelistAttachmentFieldContainerName,
    title: 'Restrict form to eligible NRIC/FIN/UENs only',
    description:
      'Only NRIC/FIN/UENs in this list are allowed to submit a response. CSV file should include all whitelisted NRIC/FIN/UENs in a single column with the "Respondent" header. ' +
      '[Download a sample .csv file](https://go.gov.sg/formsg-whitelist-respondents-sample-csv)',
    required: true,
    disabled: isDisabled,
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

        const csvString = parseCsvFile(file, (headerRow) => {
          return {
            isValid:
              headerRow &&
              headerRow.length === 1 &&
              headerRow[0].replace(/(\r\n|\n|\r)/gm, '').toLowerCase() ===
                'respondent',
            invalidReason:
              'Your CSV file should only contain a single column with the header "Respondent".',
          }
        }).then((csvRows) => {
          const whitelistedSubmitterIdsString = csvRows.reduce((acc, row) => {
            const trimmedSubmitterId = row[0].trim()
            const isSubmitterIdEmpty = !trimmedSubmitterId
            if (isSubmitterIdEmpty) {
              return acc
            }
            const isFirst = acc === ''
            const delimiter = isFirst ? '' : ','
            return acc + delimiter + trimmedSubmitterId
          }, '')
          return whitelistedSubmitterIdsString
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
                    maxSize={MAX_SIZE_IN_BYTES}
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
