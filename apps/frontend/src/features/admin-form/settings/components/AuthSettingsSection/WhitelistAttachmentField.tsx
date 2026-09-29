import { useCallback, useEffect } from 'react'
import {
  Controller,
  ControllerRenderProps,
  FormProvider,
  useForm,
} from 'react-hook-form'
import { Box, Skeleton } from '@chakra-ui/react'

import { KB } from 'formsg-shared/constants'
import { VALID_WHITELIST_FILE_EXTENSIONS } from 'formsg-shared/utils/file-validation'

import { parseCsvFile } from '~utils/parseCsvFile'
import Attachment from '~components/Field/Attachment'
import { BaseFieldProps, FieldContainer } from '~templates/Field/FieldContainer'

const MAX_SIZE_IN_BYTES = 250 * KB

export interface WhitelistAttachmentFieldProps {
  /** Distinguishes this field when a page shows more than one list. */
  fieldId: string
  title: string
  description: string
  isWhitelistEnabled: boolean
  /** Name shown for the saved list, which is only downloaded on request. */
  downloadFileName: string
  isDisabled: boolean
  isSaving: boolean
  /** Saves a new list, or removes it with `null`. Rejects with the error to show. */
  onSave: (whitelistCsvString: Promise<string> | null) => Promise<unknown>
  onDownload: () => void
}

/** Eligible-respondent CSV upload; `onSave` decides where the parsed IDs go. */
export const WhitelistAttachmentField = ({
  fieldId,
  title,
  description,
  isWhitelistEnabled,
  downloadFileName,
  isDisabled,
  isSaving,
  onSave,
  onDownload,
}: WhitelistAttachmentFieldProps): JSX.Element => {
  const containerName = `${fieldId}-container`
  const methods = useForm()
  const { control, setValue, setError, clearErrors } = methods

  const fieldContainerSchema: BaseFieldProps['schema'] = {
    _id: containerName,
    title,
    description,
    required: true,
    disabled: isDisabled,
  }

  useEffect(() => {
    // A mock file stands in for the saved list, which is only downloaded on request.
    if (isWhitelistEnabled) {
      setValue(fieldId, {
        name: downloadFileName,
        size: null,
        type: 'text/csv',
      })
    }
  }, [isWhitelistEnabled, setValue, downloadFileName, fieldId])

  const setWhitelistAttachmentFieldError = useCallback(
    (errMsg: string) => {
      setError(containerName, {
        type: 'manual',
        message: errMsg,
      })
    },
    [setError, containerName],
  )

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

        onSave(csvString)
          .then(() => {
            clearErrors(containerName)
            onChange(file)
          })
          .catch((error: Error) => {
            setWhitelistAttachmentFieldError(error.message)
          })
      }
    },
    [onSave, clearErrors, containerName, setWhitelistAttachmentFieldError],
  )

  const removeWhitelist = useCallback(() => {
    onSave(null)
      .then(() => setValue(fieldId, null))
      // The caller reports removal errors.
      .catch(() => undefined)
  }, [onSave, setValue, fieldId])

  return (
    <Box opacity={isDisabled ? 0.8 : 1}>
      <FormProvider {...methods}>
        <FieldContainer schema={fieldContainerSchema} isHighContrast={true}>
          <Controller
            name={fieldId}
            control={control}
            render={({ field: { onChange, name, value } }) => (
              <Skeleton isLoaded={!isSaving}>
                <Attachment
                  name={name}
                  value={value}
                  onChange={onFileSelect(onChange)}
                  onError={setWhitelistAttachmentFieldError}
                  handleDownloadFileOverride={onDownload}
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
  )
}
