import { useCallback, useMemo, useState } from 'react'
import {
  Controller,
  ControllerRenderProps,
  FormProvider,
  useForm,
} from 'react-hook-form'
import { Skeleton } from '@chakra-ui/react'

import { MB } from '~shared/constants'
import { AttachmentSize, BasicField } from '~shared/types'

import Attachment from '~components/Field/Attachment'
import { AttachmentFieldSchema } from '~templates/Field'
import { FieldContainer } from '~templates/Field/FieldContainer'

import { SecretKeyDownloadWhitelistFileModal } from './SecretKeyDownloadWhitelistFileModal'

export const FormWhitelistAttachmentField = (): JSX.Element => {
  const [isLoading] = useState(false)
  const [isSecretKeyModalOpen, setIsSecretKeyModalOpen] = useState(false)
  const methods = useForm()
  const { control, setValue } = methods
  const fieldContainerSchema: AttachmentFieldSchema = {
    _id: 'whitelist-csv-attachment-field-container',
    title: 'Restrict form to eligible NRIC/FIN/UEN',
    description:
      'Only NRIC/FIN/UENs in this list are allowed to submit a response. CSV file must include a “Respondent” column with all whitelisted NRIC/FIN/UENs. ' +
      '[Download a sample .csv file](https://go.gov.sg/formsg-whitelist-respondents-sample-csv)',
    required: true,
    disabled: false,
    fieldType: BasicField.Attachment,
    attachmentSize: AttachmentSize.TwentyMb,
  }

  const maxSizeInBytes = useMemo(() => {
    if (!fieldContainerSchema.attachmentSize) {
      return
    }
    return parseInt(fieldContainerSchema.attachmentSize) * MB
  }, [fieldContainerSchema.attachmentSize])

  const onFileSelect = useCallback(
    (onChange: ControllerRenderProps['onChange']) => {
      return (file: File | null) => {
        if (!file) {
          return
        }

        // TODO: Handle uploading the file to backend
        onChange(file)
      }
    },
    [],
  )

  const triggerSecretKeyInputTransition = useCallback(() => {
    setIsSecretKeyModalOpen(true)
  }, [])

  const removeWhitelist = useCallback(() => {
    setValue('whitelist-csv-attachment-field', null)

    // TODO: set the whitelist to null in the backend
  }, [setValue])

  return (
    <>
      <SecretKeyDownloadWhitelistFileModal
        isOpen={isSecretKeyModalOpen}
        onClose={() => setIsSecretKeyModalOpen(false)}
        publicKey={'JhJX184XrJf8hoG5Kl/qXj+w0dIJ8a2/jJ0GevPLxxs='}
      />
      <FormProvider {...methods}>
        <FieldContainer schema={fieldContainerSchema}>
          <Controller
            name="whitelist-csv-attachment-field"
            control={control}
            render={({ field: { onChange, name, value } }) => (
              <Skeleton isLoaded={!isLoading}>
                <Attachment
                  name={name}
                  value={value}
                  onChange={onFileSelect(onChange)}
                  handleDownloadFileOverride={triggerSecretKeyInputTransition}
                  handleRemoveFileOverride={removeWhitelist}
                  showFileSize
                  maxSize={maxSizeInBytes}
                  enableDownload
                />
              </Skeleton>
            )}
          />
        </FieldContainer>
      </FormProvider>
    </>
  )
}
