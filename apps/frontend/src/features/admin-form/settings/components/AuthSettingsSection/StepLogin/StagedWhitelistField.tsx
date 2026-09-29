import { useCallback } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Box, Text } from '@chakra-ui/react'

import { KB } from 'formsg-shared/constants'
import { VALID_WHITELIST_FILE_EXTENSIONS } from 'formsg-shared/utils/file-validation'

import { parseCsvFile } from '~utils/parseCsvFile'
import Attachment from '~components/Field/Attachment'
import { downloadFile } from '~components/Field/Attachment/utils/downloadFile'
import { BaseFieldProps, FieldContainer } from '~templates/Field/FieldContainer'

import { WhitelistDraft } from './stepLoginDraft'

const MAX_SIZE_IN_BYTES = 250 * KB

interface StagedWhitelistFieldProps {
  fieldId: string
  title: string
  description: string
  // Whether a saved list applies to the login being edited.
  hasSavedList: boolean
  draft: WhitelistDraft
  onDraftChange: (draft: WhitelistDraft) => void
  // Name shown for the saved list, which is only decrypted on request.
  savedFileName: string
  onDownloadSaved: () => void
  isDisabled: boolean
  // Shown under the field while the draft differs from what is saved.
  pendingMessage?: string
}

/**
 * Eligible-respondent CSV upload that only stages the parsed list. The caller
 * sends it with the step save, so nothing is uploaded on file selection.
 */
export const StagedWhitelistField = ({
  fieldId,
  title,
  description,
  hasSavedList,
  draft,
  onDraftChange,
  savedFileName,
  onDownloadSaved,
  isDisabled,
  pendingMessage,
}: StagedWhitelistFieldProps): JSX.Element => {
  const containerName = `${fieldId}-container`
  const methods = useForm()
  const { setError, clearErrors } = methods

  const fieldContainerSchema: BaseFieldProps['schema'] = {
    _id: containerName,
    title,
    description,
    required: true,
    disabled: isDisabled,
  }

  const setFieldError = useCallback(
    (message: string) => setError(containerName, { type: 'manual', message }),
    [setError, containerName],
  )

  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (!file) return
      parseCsvFile(file, (headerRow) => ({
        isValid:
          headerRow &&
          headerRow.length === 1 &&
          headerRow[0].replace(/(\r\n|\n|\r)/gm, '').toLowerCase() ===
            'respondent',
        invalidReason:
          'Your CSV file should only contain a single column with the header "Respondent".',
      }))
        .then((csvRows) => {
          const csvString = csvRows
            .map((row) => row[0].trim())
            .filter(Boolean)
            .join(',')
          if (!csvString) {
            setFieldError('Your csv is empty.')
            return
          }
          clearErrors(containerName)
          onDraftChange({ kind: 'new', csvString, file })
        })
        .catch((error: Error) => setFieldError(error.message))
    },
    [clearErrors, containerName, onDraftChange, setFieldError],
  )

  // The saved list is shown as a placeholder file so it can be lazily decrypted.
  const value =
    draft.kind === 'new'
      ? draft.file
      : draft.kind === 'saved' && hasSavedList
        ? ({
            name: savedFileName,
            size: null,
            type: 'text/csv',
          } as unknown as File)
        : null

  return (
    <Box opacity={isDisabled ? 0.8 : 1}>
      <FormProvider {...methods}>
        <FieldContainer schema={fieldContainerSchema} isHighContrast={true}>
          <Attachment
            name={fieldId}
            value={value}
            onChange={handleFileSelect}
            onError={setFieldError}
            handleDownloadFileOverride={() =>
              draft.kind === 'new'
                ? downloadFile(draft.file)
                : onDownloadSaved()
            }
            handleRemoveFileOverride={() => {
              clearErrors(containerName)
              onDraftChange({ kind: 'removed' })
            }}
            showFileSize
            maxSize={MAX_SIZE_IN_BYTES}
            showDownload
            showRemove
            isDownloadDisabled={false}
            isRemoveDisabled={isDisabled}
            disabled={isDisabled}
            accept={VALID_WHITELIST_FILE_EXTENSIONS}
          />
        </FieldContainer>
      </FormProvider>
      {pendingMessage ? (
        <Text textStyle="body-2" color="secondary.400" mt="0.5rem">
          {pendingMessage}
        </Text>
      ) : null}
    </Box>
  )
}
