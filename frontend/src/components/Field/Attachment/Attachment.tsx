import { useCallback, useMemo } from 'react'
import { DropzoneProps, useDropzone } from 'react-dropzone'
import {
  Box,
  forwardRef,
  Text,
  ThemingProps,
  useFormControl,
  UseFormControlProps,
  useMergeRefs,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import imageCompression from 'browser-image-compression'
import omit from 'lodash/omit'
import simplur from 'simplur'

import { MB } from '~shared/constants/file'

import { AttachmentStylesProvider } from './AttachmentContext'
import { AttachmentDropzone } from './AttachmentDropzone'
import { AttachmentFileInfo } from './AttachmentFileInfo'
import {
  getFileExtension,
  getInvalidFileExtensionsInZip,
  getReadableFileSize,
} from './utils'

const IMAGE_UPLOAD_TYPES_TO_COMPRESS = ['image/jpeg', 'image/png']

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
  colorScheme?: ThemingProps<'AttachmentField'>['colorScheme']

  /**
   * Show attachment download button.
   */
  enableDownload?: boolean

  /**
   * Show attachment removal button
   */
  enableRemove?: boolean
}

export const Attachment = forwardRef<AttachmentProps, 'div'>(
  (
    {
      onChange,
      onError,
      maxSize,
      showFileSize,
      accept,
      value,
      name,
      colorScheme,
      title,
      enableDownload,
      enableRemove,
      ...props
    },
    ref,
  ) => {
    // Merge given props with any form control props, if they exist.
    const inputProps = useFormControl(props)
    // id to set on the rendered max size FormFieldMessage component.
    const maxSizeTextId = useMemo(() => `${name}-max-size`, [name])

    const readableMaxSize = useMemo(
      () => (maxSize ? getReadableFileSize(maxSize) : undefined),
      [maxSize],
    )

    const showMaxSize = useMemo(
      () => !value && showFileSize && readableMaxSize,
      [value, readableMaxSize, showFileSize],
    )

    const handleFileDrop = useCallback<NonNullable<DropzoneProps['onDrop']>>(
      async ([acceptedFile], rejectedFiles) => {
        if (rejectedFiles.length > 0) {
          const firstError = rejectedFiles[0].errors[0]
          let errorMessage
          switch (firstError.code) {
            case 'file-invalid-type': {
              const fileExt = getFileExtension(rejectedFiles[0].file.name)
              errorMessage = `Your file's extension ending in *${fileExt} is not allowed`
              break
            }
            case 'too-many-files': {
              errorMessage = 'You can only upload a single file in this input'
              break
            }
            default:
              errorMessage = firstError.message
          }
          return onError?.(errorMessage)
        }

        // Zip validation.
        if (acceptedFile.type === 'application/zip') {
          try {
            const invalidFilesInZip = await getInvalidFileExtensionsInZip(
              acceptedFile,
              accept,
            )
            const numInvalidFiles = invalidFilesInZip.length
            // There are invalid files, return error.
            if (numInvalidFiles !== 0) {
              const hiddenQty = [numInvalidFiles, null]
              const stringOfInvalidExtensions = invalidFilesInZip.join(', ')
              return onError?.(
                simplur`The following file ${hiddenQty} extension[|s] in your zip file ${hiddenQty} [is|are] not valid: ${stringOfInvalidExtensions}`,
              )
            }
          } catch {
            return onError?.(
              'An error has occurred whilst parsing your zip file',
            )
          }
        }

        // Compress images that are too large.
        if (
          IMAGE_UPLOAD_TYPES_TO_COMPRESS.includes(acceptedFile.type) &&
          maxSize &&
          acceptedFile.size > maxSize
        ) {
          return imageCompression(acceptedFile, {
            maxSizeMB: maxSize ? maxSize / MB : undefined,
            maxWidthOrHeight: 1440,
            initialQuality: 0.8,
            useWebWorker: false,
            preserveExif: true,
          }).then((blob) =>
            onChange(
              new File([blob], acceptedFile.name, {
                type: blob.type,
              }),
            ),
          )
        }
        onChange(acceptedFile)
      },
      [accept, maxSize, onChange, onError],
    )

    const fileValidator = useCallback<NonNullable<DropzoneProps['validator']>>(
      (file) => {
        if (
          !IMAGE_UPLOAD_TYPES_TO_COMPRESS.includes(file.type) &&
          maxSize &&
          file.size > maxSize
        ) {
          return {
            code: 'file-too-large',
            message: `You have exceeded the limit, please upload a file below ${readableMaxSize}`,
          }
        }
        return null
      },
      [maxSize, readableMaxSize],
    )

    const { getRootProps, getInputProps, isDragActive, rootRef } = useDropzone({
      multiple: false,
      accept,
      disabled: inputProps.disabled,
      validator: fileValidator,
      noClick: inputProps.readOnly,
      noDrag: inputProps.readOnly,
      onDrop: handleFileDrop,
    })

    const mergedRefs = useMergeRefs(rootRef, ref)

    const styles = useMultiStyleConfig('Attachment', {
      isDragActive,
      colorScheme,
    })

    const handleRemoveFile = useCallback(() => {
      onChange(null)
      rootRef.current?.focus()
    }, [onChange, rootRef])

    const handleDownloadFile = useCallback(() => {
      if (value) {
        const url = URL.createObjectURL(value)
        const a = document.createElement('a')
        a.href = url
        a.download = value.name
        a.click()
        URL.revokeObjectURL(url)
      }
    }, [value])

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
          >
            {value ? (
              <AttachmentFileInfo
                file={value}
                handleRemoveFile={handleRemoveFile}
                handleDownloadFile={handleDownloadFile}
                enableDownload={enableDownload}
                enableRemove={enableRemove}
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
          {showMaxSize ? (
            <Text
              id={maxSizeTextId}
              color="brand.secondary.400"
              mt="0.5rem"
              textStyle="body-2"
              aria-hidden
            >
              Maximum file size: {readableMaxSize}
            </Text>
          ) : null}
        </Box>
      </AttachmentStylesProvider>
    )
  },
)
