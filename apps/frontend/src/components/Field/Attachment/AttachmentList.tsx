// PROTOTYPE (attachments-v2): several files in one attachment field. Built from
// the existing dropzone and file rows so the single-file Attachment, which MRF
// and admin views also use, stays unchanged.
import { useCallback, useMemo } from 'react'
import { DropzoneProps, useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { Box, Stack, Text, useMultiStyleConfig } from '@chakra-ui/react'

import { ATTACHMENT_THEME_KEY } from '~theme/components/Field/Attachment'
import { ThemeColorScheme } from '~theme/foundations/colours'

import { downloadFile } from './utils/downloadFile'
import { AttachmentStylesProvider } from './AttachmentContext'
import { AttachmentDropzone } from './AttachmentDropzone'
import { AttachmentFileInfo } from './AttachmentFileInfo'
import {
  getFileExtension,
  getInvalidFileExtensionsInZip,
  getReadableFileSize,
} from './utils'

export interface AttachmentListProps {
  name: string
  value: File[] | undefined | null
  onChange: (files: File[]) => void
  onError?: (errMsg: string) => void
  accept?: DropzoneProps['accept']
  /** Size limit in bytes, shared by every file in the field. */
  maxTotalSize?: number
  /** Appended to the error when a file's type is not accepted. */
  invalidTypeHint?: string
  colorScheme?: ThemeColorScheme
  title?: string
  isDisabled?: boolean
}

export const AttachmentList = ({
  name,
  value,
  onChange,
  onError,
  accept,
  maxTotalSize,
  invalidTypeHint,
  colorScheme,
  title,
  isDisabled,
}: AttachmentListProps): JSX.Element => {
  const { t } = useTranslation()
  const files = useMemo(() => value ?? [], [value])
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)

  const handleDrop = useCallback<NonNullable<DropzoneProps['onDrop']>>(
    async (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const { file, errors } = rejectedFiles[0]
        if (errors[0].code === 'file-invalid-type') {
          const message = t(
            'features.publicForm.components.fields.attachment.error.fileInvalidType',
            { fileExt: getFileExtension(file.name) },
          )
          return onError?.(
            invalidTypeHint ? `${message}. ${invalidTypeHint}` : message,
          )
        }
        return onError?.(errors[0].message)
      }

      const nextFiles = [...files, ...acceptedFiles]
      const nextTotal = nextFiles.reduce((sum, file) => sum + file.size, 0)
      if (maxTotalSize && nextTotal > maxTotalSize) {
        return onError?.(
          `These files add up to ${getReadableFileSize(nextTotal)}, over the ${getReadableFileSize(maxTotalSize)} limit for this question`,
        )
      }
      for (const file of acceptedFiles) {
        if (file.type !== 'application/zip') continue
        try {
          const invalid = await getInvalidFileExtensionsInZip(file, accept)
          if (invalid.length > 0) {
            return onError?.(
              t(
                'features.publicForm.components.fields.attachment.error.zipFileInvalidType',
                { stringOfInvalidExtensions: invalid.join(', ') },
              ),
            )
          }
        } catch {
          return onError?.(
            t(
              'features.publicForm.components.fields.attachment.error.zipParsing',
            ),
          )
        }
      }
      onChange(nextFiles)
    },
    [accept, files, invalidTypeHint, maxTotalSize, onChange, onError, t],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    accept,
    disabled: isDisabled,
    validator: (file) =>
      file.size === 0
        ? {
            code: 'file-empty',
            message: t(
              'features.publicForm.components.fields.attachment.error.fileEmpty',
            ),
          }
        : null,
    onDrop: handleDrop,
  })

  const styles = useMultiStyleConfig(ATTACHMENT_THEME_KEY, {
    isDragActive,
    colorScheme,
  })

  return (
    <AttachmentStylesProvider value={styles}>
      <Box __css={styles.container}>
        <Stack spacing="0.5rem">
          {files.map((file, index) => (
            <AttachmentFileInfo
              key={`${file.name}-${index}`}
              file={file}
              showRemove={!isDisabled}
              handleRemoveFile={() =>
                onChange(files.filter((_, i) => i !== index))
              }
              handleDownloadFile={() => downloadFile(file)}
              handleReplaceFile={() => undefined}
            />
          ))}
          {!maxTotalSize || totalSize < maxTotalSize ? (
            <Box {...getRootProps()} role="button" __css={styles.dropzone}>
              <AttachmentDropzone
                isDragActive={isDragActive}
                inputProps={getInputProps({ name })}
                readableMaxSize={
                  maxTotalSize ? getReadableFileSize(maxTotalSize) : undefined
                }
                question={title}
              />
            </Box>
          ) : null}
        </Stack>
        <Text color="secondary.400" textStyle="body-2" mt="0.5rem">
          {files.length} {files.length === 1 ? 'file' : 'files'}
          {maxTotalSize
            ? ` · ${getReadableFileSize(totalSize)} of ${getReadableFileSize(maxTotalSize)}`
            : null}
        </Text>
      </Box>
    </AttachmentStylesProvider>
  )
}
