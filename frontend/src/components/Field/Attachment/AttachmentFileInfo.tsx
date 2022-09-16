import { useMemo } from 'react'
import { BiTrash } from 'react-icons/bi'
import { Flex, Text, VisuallyHidden } from '@chakra-ui/react'

import IconButton from '~components/IconButton'

import { getReadableFileSize } from './utils/getReadableFileSize'

export interface AttachmentFileInfoProps {
  file: File
  handleRemoveFile: () => void
}

export const AttachmentFileInfo = ({
  file,
  handleRemoveFile,
}: AttachmentFileInfoProps) => {
  const readableFileSize = useMemo(
    () => getReadableFileSize(file.size),
    [file.size],
  )

  return (
    <Flex justify="space-between" bg="primary.100" py="0.875rem" px="1rem">
      <VisuallyHidden>
        File attached: {file.name} with file size of {readableFileSize}
      </VisuallyHidden>
      <Flex flexDir="column" aria-hidden>
        <Text
          textStyle="subhead-1"
          color="secondary.500"
          overflowWrap="anywhere"
        >
          {file.name}
        </Text>
        <Text textStyle="caption-1" color="secondary.500">
          {readableFileSize}
        </Text>
      </Flex>
      <IconButton
        variant="clear"
        colorScheme="danger"
        aria-label="Click to remove file"
        icon={<BiTrash />}
        onClick={handleRemoveFile}
      />
    </Flex>
  )
}
