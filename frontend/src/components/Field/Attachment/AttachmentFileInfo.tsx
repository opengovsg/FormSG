import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BiDownload, BiEditAlt, BiTrash } from 'react-icons/bi'
import { Flex, Text, VisuallyHidden } from '@chakra-ui/react'

import IconButton from '~components/IconButton'

import { getReadableFileSize } from './utils/getReadableFileSize'

export interface AttachmentFileInfoProps {
  file: File
  showDownload?: boolean
  showRemove?: boolean
  showReplace?: boolean
  isDownloadDisabled?: boolean
  isRemoveDisabled?: boolean
  handleRemoveFile: () => void
  handleDownloadFile: () => void
  handleReplaceFile: () => void
}

export const AttachmentFileInfo = ({
  file,
  handleRemoveFile,
  handleDownloadFile,
  handleReplaceFile,
  showDownload = false,
  showRemove = true,
  showReplace = false,
  isDownloadDisabled = false,
  isRemoveDisabled = false,
}: AttachmentFileInfoProps) => {
  const { t } = useTranslation()
  const readableFileSize = useMemo(
    () => (file.size ? getReadableFileSize(file.size) : null),
    [file.size],
  )
  const showDownloadButton = showDownload && file

  return (
    <Flex justify="space-between" bg="primary.100" py="0.875rem" px="1rem">
      <VisuallyHidden>
        File attached: {file.name} with file size of {readableFileSize}
      </VisuallyHidden>
      <Flex flexDir="column" justify="center" aria-hidden>
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
            aria-label={t(
              'features.publicForm.components.fields.attachment.ariaLabelRemove',
            )}
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
        {showReplace ? (
          <IconButton
            variant="clear"
            aria-label={t(
              'features.publicForm.components.fields.attachment.ariaLabelReplace',
            )}
            icon={<BiEditAlt />}
            onClick={handleReplaceFile}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
