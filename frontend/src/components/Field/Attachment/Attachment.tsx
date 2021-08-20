import { useCallback, useMemo, useState } from 'react'
import { DropzoneProps, useDropzone } from 'react-dropzone'
import {
  Box,
  chakra,
  forwardRef,
  Icon,
  Text,
  useFormControl,
  UseFormControlProps,
  useMergeRefs,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import omit from 'lodash/omit'

import { BxsCloudUpload } from '~assets/icons/BxsCloudUpload'
import { ATTACHMENT_THEME_KEY } from '~theme/components/Field/Attachment'
import FormFieldMessage from '~components/FormControl/FormFieldMessage'
import Link from '~components/Link'

import { getReadableFileSize } from './utils/getReadableFileSize'
import { AttachmentFileInfo } from './AttachmentFileInfo'

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
}

export const Attachment = forwardRef<AttachmentProps, 'div'>(
  (
    { onChange, onError, maxSize, showFileSize, accept, value, name, ...props },
    ref,
  ) => {
    // Merge given props with any form control props, if they exist.
    const inputProps = useFormControl(props)

    const [internalFile, setInternalFile] = useState<File | undefined>(value)

    const readableMaxSize = useMemo(
      () => (maxSize ? getReadableFileSize(maxSize) : undefined),
      [maxSize],
    )

    const { getRootProps, getInputProps, isDragActive, rootRef } = useDropzone({
      multiple: false,
      accept,
      disabled: inputProps.disabled,
      validator: (file) => {
        if (maxSize && file.size > maxSize) {
          return {
            code: 'file-too-large',
            message: `You have exceeded the limit, please upload a file below ${readableMaxSize}`,
          }
        }
        return null
      },
      noClick: inputProps.readOnly,
      noDrag: inputProps.readOnly,
      onDrop: ([acceptedFile], rejectedFiles) => {
        if (onError && rejectedFiles.length > 0) {
          return onError(rejectedFiles[0].errors[0].message)
        }

        onChange?.(acceptedFile)
        setInternalFile(acceptedFile)
      },
    })

    const mergedRefs = useMergeRefs(rootRef, ref)

    const styles = useMultiStyleConfig(ATTACHMENT_THEME_KEY, {
      isDragActive,
    })

    const handleRemoveFile = useCallback(() => {
      setInternalFile(undefined)
      onChange?.(undefined)
    }, [onChange])

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
      })
    }, [getRootProps, inputProps])

    const processedInputProps = useMemo(() => {
      return getInputProps({
        name,
        ...inputProps,
      })
    }, [getInputProps, inputProps, name])

    if (internalFile) {
      return (
        <Box __css={styles.container}>
          <AttachmentFileInfo
            file={internalFile}
            handleRemoveFile={handleRemoveFile}
          />
        </Box>
      )
    }

    return (
      <Box __css={styles.container}>
        <Box {...processedRootProps} ref={mergedRefs} __css={styles.dropzone}>
          <chakra.input {...processedInputProps} />
          <Icon aria-hidden as={BxsCloudUpload} __css={styles.icon} />

          {isDragActive ? (
            <Text>Drop the file here ...</Text>
          ) : (
            <Text>
              <Link isDisabled={inputProps.disabled}>Choose file</Link> or drag
              and drop here
            </Text>
          )}
        </Box>
        {showFileSize && readableMaxSize && (
          <FormFieldMessage>
            Maximum file size: {readableMaxSize}
          </FormFieldMessage>
        )}
      </Box>
    )
  },
)
