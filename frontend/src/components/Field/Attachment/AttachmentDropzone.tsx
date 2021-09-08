import { DropzoneInputProps, DropzoneState } from 'react-dropzone'
import { chakra, Icon, Text, useStyles } from '@chakra-ui/react'

import { BxsCloudUpload } from '~assets/icons/BxsCloudUpload'
import Link from '~components/Link'

interface AttachmentDropzoneProps {
  inputProps: DropzoneInputProps
  isDragActive: DropzoneState['isDragActive']
}

export const AttachmentDropzone = ({
  inputProps,
  isDragActive,
}: AttachmentDropzoneProps): JSX.Element => {
  const styles = useStyles()

  return (
    <>
      <chakra.input {...inputProps} />
      <Icon aria-hidden as={BxsCloudUpload} __css={styles.icon} />

      {isDragActive ? (
        <Text>Drop the file here ...</Text>
      ) : (
        <Text>
          <Link isDisabled={inputProps.disabled}>Choose file</Link> or drag and
          drop here
        </Text>
      )}
    </>
  )
}
