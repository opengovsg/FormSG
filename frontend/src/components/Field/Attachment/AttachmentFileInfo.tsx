import { useMemo } from 'react'
import { BiDownload, BiTrash } from 'react-icons/bi'
import { Flex, Text, VisuallyHidden } from '@chakra-ui/react'

import IconButton from '~components/IconButton'

import { getReadableFileSize } from './utils/getReadableFileSize'

export interface AttachmentFileInfoProps {
  file: File
  enableDownload?: boolean
  enableRemove?: boolean
  handleRemoveFile: () => void
  handleDownloadFile: () => void
}

export const AttachmentFileInfo = ({
  file,
  enableDownload = false,
  enableRemove = true,
  handleRemoveFile,
  handleDownloadFile,
}: AttachmentFileInfoProps) => {
  const readableFileSize = useMemo(
    () => getReadableFileSize(file.size),
    [file.size],
  )

  const showDownloadButton = enableDownload && file

  return (
    <Flex justify="space-between" bg="brand.primary.50" py="0.875rem" px="1rem">
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
      <Flex>
        {enableRemove ? (
          <IconButton
            variant="clear"
            colorScheme="danger"
            aria-label="Click to remove file"
            icon={<BiTrash />}
            onClick={handleRemoveFile}
          />
        ) : null}
        {showDownloadButton ? (
          <IconButton
            variant="clear"
            aria-label="Click to download file"
            icon={<BiDownload />}
            onClick={handleDownloadFile}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
