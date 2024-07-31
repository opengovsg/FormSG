import { DropzoneInputProps, DropzoneState } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { chakra, Icon, Text, useStyles, VisuallyHidden } from '@chakra-ui/react'

import { BxsCloudUpload } from '~assets/icons/BxsCloudUpload'
import Link from '~components/Link'

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
  const { t } = useTranslation()
  const styles = useStyles()

  return (
    <>
      <VisuallyHidden>
        {question} Click to upload file, maximum file size of {readableMaxSize}
      </VisuallyHidden>
      <chakra.input {...inputProps} data-testid={inputProps.name} />
      <Icon aria-hidden as={BxsCloudUpload} __css={styles.icon} />

      {isDragActive ? (
        <Text aria-hidden>
          {t('features.adminForm.sidebar.fields.imageAttachment.dragActive')}
        </Text>
      ) : (
        <Text aria-hidden>
          <Link isDisabled={inputProps.disabled}>
            {t(
              'features.adminForm.sidebar.fields.imageAttachment.fileUploaderLink',
            )}
          </Link>
          {t('features.adminForm.sidebar.fields.imageAttachment.dragAndDrop')}
        </Text>
      )}
    </>
  )
}
