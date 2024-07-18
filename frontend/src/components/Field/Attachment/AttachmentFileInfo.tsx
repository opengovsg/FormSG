import { useMemo } from 'react'
import { BiDownload, BiTrash } from 'react-icons/bi'
import { Flex, Text, VisuallyHidden } from '@chakra-ui/react'

import IconButton from '~components/IconButton'

import { getReadableFileSize } from './utils/getReadableFileSize'

export interface AttachmentFileInfoProps {
  file: File
  showDownload?: boolean
  showRemove?: boolean
  isDownloadDisabled?: boolean
  isRemoveDisabled?: boolean
  handleRemoveFile: () => void
  handleDownloadFile: () => void
}

export const AttachmentFileInfo = ({
  file,
  showDownload = false,
  showRemove = true,
  isDownloadDisabled = false,
  isRemoveDisabled = false,
  handleRemoveFile,
  handleDownloadFile,
}: AttachmentFileInfoProps) => {
  const readableFileSize = useMemo(
    () => getReadableFileSize(file.size),
    [file.size],
  )

  const showDownloadButton = showDownload && file

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
      <Flex>
        {showRemove ? (
          <IconButton
            variant="clear"
            colorScheme="danger"
            aria-label="Click to remove file"
            icon={<BiTrash />}
            onClick={handleRemoveFile}
            isDisabled={isRemoveDisabled}
          />
        ) : null}
        {showDownloadButton ? (
          <IconButton
            variant="clear"
            aria-label="Click to download file"
            icon={<BiDownload />}
            onClick={handleDownloadFile}
            isDisabled={isDownloadDisabled}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
