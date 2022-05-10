import { useMemo } from 'react'
import { BiTrash } from 'react-icons/bi'
import { Flex, forwardRef, Text, VisuallyHidden } from '@chakra-ui/react'

import IconButton from '~components/IconButton'

import { getReadableFileSize } from './utils/getReadableFileSize'

export interface AttachmentFileInfoProps {
  file: File
  handleRemoveFile: () => void
}

export const AttachmentFileInfo = forwardRef<AttachmentFileInfoProps, 'div'>(
  ({ file, handleRemoveFile }, ref) => {
    const readableFileSize = useMemo(
      () => getReadableFileSize(file.size),
      [file.size],
    )

    return (
      <Flex
        ref={ref}
        justify="space-between"
        bg="primary.100"
        py="0.875rem"
        px="1rem"
      >
        <VisuallyHidden>
          File attached: {file.name} with file size of {readableFileSize}
        </VisuallyHidden>
        <Flex flexDir="column" aria-hidden>
          <Text textStyle="subhead-1" color="secondary.500">
            {file.name}
          </Text>
          <Text textStyle="caption-1" color="secondary.500">
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
  },
)
