import { useCallback, useMemo } from 'react'
import { DropzoneProps, useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import {
  Box,
  forwardRef,
  Text,
  useFormControl,
  UseFormControlProps,
  useMergeRefs,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import omit from 'lodash/omit'

import { ATTACHMENT_THEME_KEY } from '~theme/components/Field/Attachment'
import { ThemeColorScheme } from '~theme/foundations/colours'

import { downloadFile } from './utils/downloadFile'
import { AttachmentStylesProvider } from './AttachmentContext'
import { AttachmentDropzone } from './AttachmentDropzone'
import { AttachmentFileInfo } from './AttachmentFileInfo'
import { useAttachmentFileChecks } from './useAttachmentFileChecks'

export interface AttachmentProps extends UseFormControlProps<HTMLElement> {
  /**
   * Callback to be invoked when the file is attached or removed.
   * Do not use undefined to clear the value, use null instead.
   */
  onChange: (file: File | null) => void
  /**
   * If exists, callback to be invoked when file has errors.
   */
  onError?: (errMsg: string) => void
  /**
   * Current value of the input.
   */
  value: File | undefined | null
  /**
   * Name of the input.
   */
  name: string
  /**
   * One or more
   * [unique file type specifiers](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#unique_file_type_specifiers)
   * describing file types to allow
   */
  accept?: DropzoneProps['accept']
  /**
   * If exists, the only file types to accept in place of `accept`, named in
   * the error when a file of another type is picked.
   */
  allowedFileTypes?: string[]
  /**
   * Text to state miscellaneous uploaded file constraints.
   */
  fileConstraintsText?: string
  /**
   * If exists, files cannot be attached if they are above the maximum size
   * (in bytes).
   */
  maxSize?: DropzoneProps['maxSize']
  /**
   * Boolean flag on whether to show the file size helper message below the
   * input.
   */
  showFileSize?: boolean

  /**
   * Color scheme of the component.
   */
  colorScheme?: ThemeColorScheme

  /**
   * Show attachment download button.
   */
  showDownload?: boolean

  /**
   * Disable download button.
   */
  isDownloadDisabled?: boolean

  /**
   * Disable remove button.
   */
  isRemoveDisabled?: boolean

  /**
   * Show attachment removal button
   */
  showRemove?: boolean

  /**
   * Show replace button
   */
  showReplace?: boolean

  /**
   * Override callback function that is invoked when download button is clicked.
   */
  handleDownloadFileOverride?: () => void

  /**
   * Override callback function that is invoked when remove button is clicked.
   */
  handleRemoveFileOverride?: () => void

  /**
   * Callback function that is invoked when replace button is clicked. 'Show Replace' must be present for function to work.
   */
  handleReplaceFileOverride?: () => void
}

export const Attachment = forwardRef<AttachmentProps, 'div'>(
  (
    {
      onChange,
      onError,
      maxSize,
      fileConstraintsText,
      showFileSize,
      accept,
      allowedFileTypes,
      value,
      name,
      colorScheme,
      title,
      showDownload,
      showRemove,
      showReplace,
      isDownloadDisabled,
      isRemoveDisabled,
      handleDownloadFileOverride,
      handleRemoveFileOverride,
      handleReplaceFileOverride,
      ...props
    },
    ref,
  ) => {
    const { t } = useTranslation()
    // Merge given props with any form control props, if they exist.
    const inputProps = useFormControl(props)
    // id to set on the rendered max size FormFieldMessage component.
    const maxSizeTextId = useMemo(() => `${name}-max-size`, [name])

    const {
      readableMaxSize,
      getRejectionErrorMessage,
      prepareFile,
      fileValidator,
    } = useAttachmentFileChecks({ allowedFileTypes, maxSize })

    const showMaxSize = useMemo(
      () => !value && showFileSize && readableMaxSize,
      [value, readableMaxSize, showFileSize],
    )

    const handleFileDrop = useCallback<NonNullable<DropzoneProps['onDrop']>>(
      async ([acceptedFile], rejectedFiles) => {
        const [firstRejection] = rejectedFiles
        if (firstRejection) {
          return onError?.(getRejectionErrorMessage(firstRejection))
        }
        const prepared = await prepareFile(acceptedFile)
        if (prepared.kind === 'error') return onError?.(prepared.errorMessage)
        onChange(prepared.file)
      },
      [getRejectionErrorMessage, onChange, onError, prepareFile],
    )

    const { getRootProps, getInputProps, isDragActive, rootRef } = useDropzone({
      multiple: false,
      accept: allowedFileTypes ?? accept,
      disabled: inputProps.disabled,
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

    const _handleRemoveFile = useCallback(() => {
      onChange(null)
      rootRef.current?.focus()
    }, [onChange, rootRef])

    const handleRemoveFile = handleRemoveFileOverride ?? _handleRemoveFile

    const _handleDownloadFile = useCallback(() => {
      if (value) {
        downloadFile(value)
      }
    }, [value])

    const handleDownloadFile = handleDownloadFileOverride ?? _handleDownloadFile

    const _handleReplaceFile = useCallback(() => {
      onChange(null)
      rootRef.current?.focus()
    }, [onChange, rootRef])

    const handleReplaceFile = handleReplaceFileOverride ?? _handleReplaceFile

    // Bunch of memoization to avoid unnecessary re-renders.
    const processedRootProps = useMemo(() => {
      return getRootProps({
        // Root div does not need id prop, prevents duplicate ids.
        ...omit(inputProps, ['id', 'aria-describedby']),
        // Bunch of extra work to prevent field from being used when in readOnly
        // state.
        onKeyDown: (e) => {
          if (inputProps.readOnly) {
            e.stopPropagation()
            return
          }
        },
        tabIndex: value ? -1 : 0,
      })
    }, [getRootProps, inputProps, value])

    const processedInputProps = useMemo(() => {
      return getInputProps({
        name,
        ...inputProps,
      })
    }, [getInputProps, inputProps, name])

    return (
      <AttachmentStylesProvider value={styles}>
        <Box __css={styles.container}>
          <Box
            {...processedRootProps}
            {...(!value
              ? { role: 'button', ref: mergedRefs, __css: styles.dropzone }
              : {})}
            tabIndex={inputProps.disabled ? -1 : 0} // prevent focus capture when disabled
          >
            {value ? (
              <AttachmentFileInfo
                file={value}
                handleRemoveFile={handleRemoveFile}
                handleDownloadFile={handleDownloadFile}
                handleReplaceFile={handleReplaceFile}
                showDownload={showDownload}
                showRemove={showRemove}
                showReplace={showReplace}
                isDownloadDisabled={isDownloadDisabled}
                isRemoveDisabled={isRemoveDisabled}
              />
            ) : (
              <AttachmentDropzone
                isDragActive={isDragActive}
                inputProps={processedInputProps}
                readableMaxSize={readableMaxSize}
                question={title}
              />
            )}
          </Box>
          <Box
            mt={fileConstraintsText || showMaxSize ? '0.5rem' : 0}
            gap="0.25rem"
          >
            {fileConstraintsText ? (
              <Text
                id={maxSizeTextId}
                color="secondary.400"
                textStyle="body-2"
                aria-hidden
              >
                {t(
                  'features.publicForm.components.fields.attachment.fileConstraintsText',
                  {
                    fileConstraintsText,
                  },
                )}
              </Text>
            ) : null}
            {showMaxSize ? (
              <Text
                id={maxSizeTextId}
                color="secondary.400"
                textStyle="body-2"
                aria-hidden
              >
                {t(
                  'features.publicForm.components.fields.attachment.maxFileSize',
                  {
                    readableMaxSize,
                  },
                )}
              </Text>
            ) : null}
          </Box>
        </Box>
      </AttachmentStylesProvider>
    )
  },
)
