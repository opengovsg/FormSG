import { useCallback, useMemo, useState } from 'react'
import { DropzoneProps, useDropzone } from 'react-dropzone'
import { BiTrash } from 'react-icons/bi'
import {
  Box,
  chakra,
  Flex,
  forwardRef,
  Icon,
  Text,
  useMergeRefs,
} from '@chakra-ui/react'

import { BxsCloudUpload } from '~assets/icons/BxsCloudUpload'
import IconButton from '~components/IconButton'
import Link from '~components/Link'

import { getReadableFileSize } from './utils/getReadableFileSize'

const AttachedFileInfo = ({
  file,
  handleRemoveFile,
}: {
  file: File
  handleRemoveFile: () => void
}) => {
  const readableFileSize = useMemo(
    () => getReadableFileSize(file.size),
    [file.size],
  )

  return (
    <Flex justify="space-between" bg="primary.100" py="0.875rem" px="1rem">
      <Flex flexDir="column">
        <Text textStyle="subhead-1" color="secondary.500">
          {file.name}
        </Text>
        <Text textStyle="caption-1" color="secondary.400">
          {readableFileSize}
        </Text>
      </Flex>
      <IconButton
        variant="clear"
        colorScheme="danger"
        aria-label="remove file"
        icon={<BiTrash />}
        onClick={handleRemoveFile}
      />
    </Flex>
  )
}

export interface AttachmentProps {
  onChange?: (file?: File) => void
  onError?: (errMsg: string) => void
  onBlur?: () => void
  value?: File
  name: string

  maxSize?: DropzoneProps['maxSize']
  showFileSize?: boolean
}

export const Attachment = forwardRef<AttachmentProps, 'input'>(
  (
    {
      onChange,
      onBlur,
      onError,
      maxSize,
      showFileSize,
      accept,
      value,
      ...props
    },
    _ref,
  ) => {
    const [internalFile, setInternalFile] = useState<File | undefined>(value)

    const readableMaxSize = useMemo(
      () => (maxSize ? getReadableFileSize(maxSize) : undefined),
      [maxSize],
    )

    const { getRootProps, getInputProps, isDragActive, rootRef } = useDropzone({
      multiple: false,
      accept,
      validator: (file) => {
        if (maxSize && file.size > maxSize) {
          return {
            code: 'file-too-large',
            message: `You have exceeded the limit, please upload a file below ${readableMaxSize}`,
          }
        }
        return null
      },
      onDrop: ([acceptedFile], rejectedFiles) => {
        if (onError && rejectedFiles.length > 0) {
          return onError(rejectedFiles[0].errors[0].message)
        }

        onChange?.(acceptedFile)
        setInternalFile(acceptedFile)
      },
    })

    const mergedRefs = useMergeRefs(rootRef, _ref)

    const handleRemoveFile = useCallback(() => {
      setInternalFile(undefined)
      onChange?.(undefined)
    }, [onChange])

    if (internalFile) {
      return (
        <Box maxW="29.5rem">
          <AttachedFileInfo
            file={internalFile}
            handleRemoveFile={handleRemoveFile}
          />
        </Box>
      )
    }

    return (
      <Box maxW="29.5rem">
        <Flex
          {...getRootProps()}
          ref={mergedRefs}
          transitionProperty="common"
          transitionDuration="normal"
          flexDir="column"
          align="center"
          justify="center"
          cursor="pointer"
          px="3rem"
          py="4rem"
          border="1px dashed"
          borderColor="primary.700"
          borderRadius="0.25rem"
          bg={isDragActive ? 'primary.200' : 'neutral.100'}
          _focus={{
            border: '1px solid',
            borderColor: 'primary.500',
            boxShadow: `0 0 0 1px var(--chakra-colors-primary-500) !important`,
          }}
          _hover={{
            bg: 'primary.100',
          }}
          _active={{
            bg: 'primary.200',
          }}
        >
          <chakra.input {...getInputProps({ name: props.name, onBlur })} />
          <Icon
            aria-hidden
            as={BxsCloudUpload}
            fontSize="3.5rem"
            color="secondary.500"
          />
          <Text textStyle="body-1">
            {isDragActive ? (
              'Drop the file here ...'
            ) : (
              <>
                <Link>Choose file</Link> or drag and drop here
              </>
            )}
          </Text>
        </Flex>
        {showFileSize && readableMaxSize && (
          <Text textStyle="body-2" color="secondary.400" my="0.5rem">
            Maximum file size: {readableMaxSize}
          </Text>
        )}
      </Box>
    )
  },
)
