import { useCallback, useMemo, useState } from 'react'
import { DropzoneProps, useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import {
  Box,
  forwardRef,
  Stack,
  Text,
  useFormControl,
  UseFormControlProps,
  useMergeRefs,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { predictLength } from 'client-zip'
import omit from 'lodash/omit'

import { findClashingFileName } from 'formsg-shared/utils/multi-attachment'

import { ATTACHMENT_THEME_KEY } from '~theme/components/Field/Attachment'
import { ThemeColorScheme } from '~theme/foundations/colours'

import { downloadFile } from './utils/downloadFile'
import { AttachmentStylesProvider } from './AttachmentContext'
import { AttachmentDropzone } from './AttachmentDropzone'
import { AttachmentFileInfo } from './AttachmentFileInfo'
import { useAttachmentFileChecks } from './useAttachmentFileChecks'

export interface MultiAttachmentProps extends UseFormControlProps<HTMLElement> {
  onChange: (files: File[]) => void | Promise<void>
  onError?: (errMsg: string) => void
  value: File[]
  name: string
  accept?: DropzoneProps['accept']
  allowedFileTypes?: string[]
  maxTotalSize?: number
  maxFiles: number
  colorScheme?: ThemeColorScheme
  showDownload?: boolean
  showRemove?: boolean
}

export const MultiAttachment = forwardRef<MultiAttachmentProps, 'div'>(
  (
    {
      onChange,
      onError,
      maxTotalSize,
      maxFiles,
      accept,
      allowedFileTypes,
      value: files,
      name,
      colorScheme,
      title,
      showDownload,
      showRemove,
      ...props
    },
    ref,
  ) => {
    const { t } = useTranslation()
    const inputProps = useFormControl(props)
    const maxSizeTextId = useMemo(() => `${name}-max-size`, [name])

    const {
      readableMaxSize,
      getRejectionErrorMessage,
      prepareFile,
      fileValidator,
    } = useAttachmentFileChecks({ allowedFileTypes, maxSize: maxTotalSize })
    const [isAddingFiles, setIsAddingFiles] = useState(false)

    const handleFileDrop = useCallback<NonNullable<DropzoneProps['onDrop']>>(
      async (acceptedFiles, rejectedFiles) => {
        const [firstRejection] = rejectedFiles
        if (firstRejection) {
          return onError?.(getRejectionErrorMessage(firstRejection))
        }
        if (files.length + acceptedFiles.length > maxFiles) {
          return onError?.(
            t(
              'features.publicForm.components.fields.attachment.error.tooManyAttachments',
              { maxFiles },
            ),
          )
        }
        const repeated = findClashingFileName(
          [...files, ...acceptedFiles].map(({ name }) => name),
        )
        if (repeated !== undefined) {
          return onError?.(
            t(
              'features.publicForm.components.fields.attachment.error.duplicateFilename',
              { fileName: repeated },
            ),
          )
        }
        setIsAddingFiles(true)
        try {
          // One at a time, as compressing a large image holds it all in memory
          const newFiles: File[] = []
          for (const file of acceptedFiles) {
            const result = await prepareFile(file)
            if (result.kind === 'error') return onError?.(result.errorMessage)
            newFiles.push(result.file)
          }
          const nextFiles = [...files, ...newFiles]
          const zipSize = predictLength(
            nextFiles.map(({ name, size }) => ({ name, size })),
          )
          if (maxTotalSize && zipSize > maxTotalSize) {
            return onError?.(
              t(
                'features.publicForm.components.fields.attachment.error.totalSizeTooLarge',
                { readableMaxSize },
              ),
            )
          }
          await onChange(nextFiles)
        } finally {
          setIsAddingFiles(false)
        }
      },
      [
        files,
        getRejectionErrorMessage,
        maxFiles,
        maxTotalSize,
        onChange,
        onError,
        prepareFile,
        readableMaxSize,
        t,
      ],
    )

    const { getRootProps, getInputProps, isDragActive, rootRef } = useDropzone({
      multiple: true,
      accept: allowedFileTypes ?? accept,
      disabled: inputProps.disabled || isAddingFiles,
      validator: fileValidator,
      noClick: inputProps.readOnly,
      noDrag: inputProps.readOnly,
      onDrop: handleFileDrop,
    })

    const mergedRefs = useMergeRefs(rootRef, ref)

    const styles = useMultiStyleConfig(ATTACHMENT_THEME_KEY, {
      isDragActive,
      colorScheme,
    })

    const handleRemoveFile = useCallback(
      (index: number) => {
        onChange(files.filter((_, i) => i !== index))
        rootRef.current?.focus()
      },
      [files, onChange, rootRef],
    )

    const processedRootProps = useMemo(
      () =>
        getRootProps({
          ...omit(inputProps, ['id', 'aria-describedby']),
          onKeyDown: (e) => {
            if (inputProps.readOnly) e.stopPropagation()
          },
        }),
      [getRootProps, inputProps],
    )

    const processedInputProps = useMemo(
      () => getInputProps({ name, ...inputProps }),
      [getInputProps, inputProps, name],
    )

    return (
      <AttachmentStylesProvider value={styles}>
        <Box __css={styles.container}>
          <Box
            {...processedRootProps}
            role="button"
            ref={mergedRefs}
            __css={styles.dropzone}
            tabIndex={inputProps.disabled ? -1 : 0}
          >
            <AttachmentDropzone
              isDragActive={isDragActive}
              inputProps={processedInputProps}
              readableMaxSize={readableMaxSize}
              question={title}
            />
          </Box>
          {readableMaxSize ? (
            <Text
              id={maxSizeTextId}
              mt="0.5rem"
              color="secondary.400"
              textStyle="body-2"
              aria-hidden
            >
              {t(
                'features.publicForm.components.fields.attachment.maxAttachmentSize',
                { readableMaxSize },
              )}
            </Text>
          ) : null}
          {files.length > 0 ? (
            <Stack mt="0.75rem" spacing="0.5rem">
              {files.map((file, index) => (
                <AttachmentFileInfo
                  key={file.name}
                  file={file}
                  handleRemoveFile={() => handleRemoveFile(index)}
                  handleDownloadFile={() => downloadFile(file)}
                  showDownload={showDownload}
                  showRemove={showRemove}
                  isRemoveDisabled={isAddingFiles}
                />
              ))}
            </Stack>
          ) : null}
        </Box>
      </AttachmentStylesProvider>
    )
  },
)
