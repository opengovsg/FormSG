import { DropzoneInputProps, DropzoneState } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
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

const DropzoneText = ({ inputProps }: { inputProps: DropzoneInputProps }) => {
  const { t } = useTranslation()
  const isDisabled = inputProps.disabled

  return (
    <Text aria-hidden color="secondary.700">
      {isDisabled ? (
        t('features.publicForm.components.fields.attachment.disabled')
      ) : (
        <>
          <Link>
            {t(
              'features.publicForm.components.fields.attachment.fileUploaderLink',
            )}
          </Link>

          {t('features.publicForm.components.fields.attachment.dragAndDrop')}
        </>
      )}
    </Text>
  )
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
        <Text aria-hidden color="secondary.700">
          Drop the file here...
        </Text>
      ) : (
        <DropzoneText inputProps={inputProps} />
      )}
    </>
  )
}
