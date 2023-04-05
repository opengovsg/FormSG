import { useCallback, useMemo } from 'react'
import {
  Controller,
  ControllerRenderProps,
  useFormContext,
} from 'react-hook-form'

import { MB } from '~shared/constants/file'
import { FormColorTheme } from '~shared/types'
import { VALID_EXTENSIONS } from '~shared/utils/file-validation'

import { createAttachmentValidationRules } from '~utils/fieldValidation'
import Attachment from '~components/Field/Attachment'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { AttachmentFieldInput, AttachmentFieldSchema } from '../types'

export interface AttachmentFieldProps extends BaseFieldProps {
  schema: AttachmentFieldSchema
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const AttachmentField = ({
  schema,
  colorTheme = FormColorTheme.Blue,
}: AttachmentFieldProps): JSX.Element => {
  const fieldName = schema._id
  const validationRules = useMemo(
    () => createAttachmentValidationRules(schema),
    [schema],
  )

  const { clearErrors, setError, control } =
    useFormContext<AttachmentFieldInput>()

  const maxSizeInBytes = useMemo(() => {
    return parseInt(schema.attachmentSize) * MB
  }, [schema.attachmentSize])

  const setErrorMessage = useCallback(
    (errorMessage: string) => {
      setError(fieldName, { message: errorMessage })
    },
    [fieldName, setError],
  )

  const handleFileChange = useCallback(
    (onChange: ControllerRenderProps['onChange']) =>
      async (file: File | undefined) => {
        clearErrors(fieldName)
        let clone = file
        // Clone file due to bug where attached file may be empty or corrupted if the
        // file is a Google Drive file selected from Android's native file picker.
        // Cloning the file ensures that the file can be read (and/or not mutated by Android)
        // and throws an error if the file cannot be read instead of silently failing and only throw
        // an error during form submission.
        // See https://bugs.chromium.org/p/chromium/issues/detail?id=1063576#c79
        // and https://stackoverflow.com/questions/62714319/attached-from-google-drivecloud-storage-in-android-file-gives-err-upload-file
        // as possible sources of the error (still not confirmed it is the same thing).
        if (file) {
          try {
            const buffer = await file.arrayBuffer()
            clone = new File([buffer], file.name, { type: file.type })
          } catch (error) {
            setErrorMessage(
              'There was an error reading your file. If you are uploading a file and using online storage such as Google Drive, download your file before attaching the downloaded version. Otherwise, please refresh and try again.',
            )
            console.error('handleFileChange', error) // For RUM error tracking
          }
        }
        onChange(clone)
      },
    [clearErrors, fieldName, setErrorMessage],
  )

  return (
    <FieldContainer schema={schema}>
      <Controller
        control={control}
        render={({ field: { onChange, ...rest } }) => (
          <Attachment
            {...rest}
            colorScheme={`theme-${colorTheme}`}
            maxSize={maxSizeInBytes}
            accept={VALID_EXTENSIONS}
            showFileSize
            onChange={handleFileChange(onChange)}
            onError={setErrorMessage}
            title={`${schema.questionNumber}. ${schema.title}`}
          />
        )}
        name={fieldName}
        rules={validationRules}
      />
    </FieldContainer>
  )
}
