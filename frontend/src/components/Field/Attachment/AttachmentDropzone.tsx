import { DropzoneInputProps, DropzoneState } from 'react-dropzone'
import { chakra, Icon, Text, VisuallyHidden } from '@chakra-ui/react'

import { BxsCloudUpload } from '~assets/icons/BxsCloudUpload'
import Link from '~components/Link'

import { useAttachmentStyles } from './AttachmentContext'

interface AttachmentDropzoneProps {
  inputProps: DropzoneInputProps
  isDragActive: DropzoneState['isDragActive']
  readableMaxSize?: string
  question?: string
}

export const AttachmentDropzone = ({
  inputProps,
  isDragActive,
  readableMaxSize,
  question,
}: AttachmentDropzoneProps): JSX.Element => {
  const styles = useAttachmentStyles()

  return (
    <>
      <VisuallyHidden>
        {question} Click to upload file, maximum file size of {readableMaxSize}
      </VisuallyHidden>
      <chakra.input {...inputProps} data-testid={inputProps.name} />
      <Icon aria-hidden as={BxsCloudUpload} __css={styles.icon} />

      {isDragActive ? (
        <Text aria-hidden>Drop the file here...</Text>
      ) : (
        <Text aria-hidden>
          <Link isDisabled={inputProps.disabled}>Choose file</Link> or drag and
          drop here
        </Text>
      )}
    </>
  )
}
