import { useCallback, useMemo, useState } from 'react'
import { DropzoneProps, useDropzone } from 'react-dropzone'
import {
  Box,
  forwardRef,
  StylesProvider,
  Text,
  useFormControl,
  UseFormControlProps,
  useMergeRefs,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import omit from 'lodash/omit'
import simplur from 'simplur'

import { ATTACHMENT_THEME_KEY } from '~theme/components/Field/Attachment'
import { ThemeColorScheme } from '~theme/foundations/colours'

import { AttachmentDropzone } from './AttachmentDropzone'
import { AttachmentFileInfo } from './AttachmentFileInfo'
import {
  getFileExtension,
  getInvalidFileExtensionsInZip,
  getReadableFileSize,
} from './utils'

export interface AttachmentProps extends UseFormControlProps<HTMLElement> {
  /**
   * If exists, callback to be invoked when the file is attached or removed.
   */
  onChange?: (file?: File) => void
  /**
   * If exists, callback to be invoked when file has errors.
   */
  onError?: (errMsg: string) => void
  /**
   * Current value of the input.
   */
  value?: File
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
  colorScheme?: ThemeColorScheme
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
      ...props
    },
    ref,
  ) => {
    // Merge given props with any form control props, if they exist.
    const inputProps = useFormControl(props)
    // id to set on the rendered max size FormFieldMessage component.
    const maxSizeTextId = useMemo(() => `${name}-max-size`, [name])

    const [internalFile, setInternalFile] = useState<File | undefined>(value)

    const readableMaxSize = useMemo(
      () => (maxSize ? getReadableFileSize(maxSize) : undefined),
      [maxSize],
    )

    const showMaxSize = useMemo(
      () => !internalFile && showFileSize && readableMaxSize,
      [internalFile, readableMaxSize, showFileSize],
    )

    const ariaDescribedBy = useMemo(() => {
      const describedByIds = new Set<string>()
      // Must be in this order so the screen reader reads out something coherent.
      // 1. Label text (if available)
      // 2. Initial describedby text (if available)
      // 3. Max size text (if prop is true)
      if (inputProps.id) {
        describedByIds.add(`${inputProps.id}-label`)
      }
      inputProps['aria-describedby']
        ?.split(' ')
        .map((id) => describedByIds.add(id))
      if (showMaxSize) {
        describedByIds.add(maxSizeTextId)
      }

      // Remove helptext, since label should already consist of the text
      describedByIds.delete(`${inputProps.id}-helptext`)

      return Array.from(describedByIds).filter(Boolean).join(' ').trim()
    }, [inputProps, maxSizeTextId, showMaxSize])

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

        onChange?.(acceptedFile)
        setInternalFile(acceptedFile)
      },
      [accept, onChange, onError],
    )

    const fileValidator = useCallback<NonNullable<DropzoneProps['validator']>>(
      (file) => {
        if (maxSize && file.size > maxSize) {
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

    const styles = useMultiStyleConfig(ATTACHMENT_THEME_KEY, {
      isDragActive,
      colorScheme,
    })

    const handleRemoveFile = useCallback(() => {
      setInternalFile(undefined)
      onChange?.(undefined)
      rootRef.current?.focus()
    }, [onChange, rootRef])

    // Bunch of memoization to avoid unnecessary re-renders.
    const processedRootProps = useMemo(() => {
      return getRootProps({
        // Root div does not need id prop, prevents duplicate ids.
        ...omit(inputProps, 'id'),
        // Bunch of extra work to prevent field from being used when in readOnly
        // state.
        onKeyDown: (e) => {
          if (inputProps.readOnly) {
            e.stopPropagation()
            return
          }
        },
        tabIndex: internalFile ? -1 : 0,
        'aria-describedby': ariaDescribedBy,
      })
    }, [ariaDescribedBy, getRootProps, inputProps, internalFile])

    const processedInputProps = useMemo(() => {
      return getInputProps({
        name,
        ...inputProps,
      })
    }, [getInputProps, inputProps, name])

    return (
      <StylesProvider value={styles}>
        <Box __css={styles.container}>
          <Box
            {...processedRootProps}
            ref={mergedRefs}
            __css={internalFile ? undefined : styles.dropzone}
          >
            {internalFile ? (
              <AttachmentFileInfo
                file={internalFile}
                handleRemoveFile={handleRemoveFile}
              />
            ) : (
              <AttachmentDropzone
                isDragActive={isDragActive}
                inputProps={processedInputProps}
              />
            )}
          </Box>
          {showMaxSize ? (
            <Text
              id={maxSizeTextId}
              color="secondary.400"
              mt="0.5rem"
              textStyle="body-2"
            >
              Maximum file size: {readableMaxSize}
            </Text>
          ) : null}
        </Box>
      </StylesProvider>
    )
  },
)
