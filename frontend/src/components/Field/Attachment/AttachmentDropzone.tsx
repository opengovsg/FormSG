import { DropzoneInputProps, DropzoneState } from 'react-dropzone'
import { chakra, Icon, Text, useStyles, VisuallyHidden } from '@chakra-ui/react'

import { BxsCloudUpload } from '~assets/icons/BxsCloudUpload'
import Link from '~components/Link'

interface AttachmentDropzoneProps {
  inputProps: DropzoneInputProps
  isDragActive: DropzoneState['isDragActive']
  readableMaxSize?: string
}

export const AttachmentDropzone = ({
  inputProps,
  isDragActive,
  readableMaxSize,
}: AttachmentDropzoneProps): JSX.Element => {
  const styles = useStyles()

  return (
    <>
      <VisuallyHidden>
        Click to upload file, maximum file size of {readableMaxSize}
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
