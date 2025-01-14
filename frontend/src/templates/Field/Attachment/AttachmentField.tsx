import { useCallback, useMemo } from 'react'
import {
  Controller,
  ControllerRenderProps,
  useFormContext,
} from 'react-hook-form'
import { datadogLogs } from '@datadog/browser-logs'

import { MB } from '~shared/constants/file'
import { FormColorTheme } from '~shared/types'
import { VALID_EXTENSIONS } from '~shared/utils/file-validation'

import { createAttachmentValidationRules } from '~utils/fieldValidation'
import fileArrayBuffer from '~utils/fileArrayBuffer'
import Attachment from '~components/Field/Attachment'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { AttachmentFieldInput, AttachmentFieldSchema } from '../types'

export interface AttachmentFieldProps extends BaseFieldProps {
  schema: AttachmentFieldSchema
  disableRequiredValidation?: boolean
  showDownload?: boolean
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const AttachmentField = ({
  schema,
  disableRequiredValidation,
  showDownload,
  colorTheme = FormColorTheme.Blue,
}: AttachmentFieldProps): JSX.Element => {
  const fieldName = schema._id
  const validationRules = useMemo(
    () => createAttachmentValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
  )

  const { clearErrors, setError, control } =
    useFormContext<AttachmentFieldInput>()

  const maxSizeInBytes = useMemo(() => {
    if (!schema.attachmentSize) {
      return
    }
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
      async (file: File | null) => {
        if (schema.disabled) {
          return
        }
        clearErrors(fieldName)
        // Case where attachment is cleared.
        if (!file) {
          onChange(null)
          return
        }
        // Clone file due to bug where attached file may be empty or corrupted if the
        // file is a Google Drive file selected from Android's native file picker.
        // Cloning the file ensures that the file can be read (and/or not mutated by Android)
        // and throws an error if the file cannot be read instead of silently failing and only throw
        // an error during form submission.
        // See https://bugs.chromium.org/p/chromium/issues/detail?id=1063576#c79
        // and https://stackoverflow.com/questions/62714319/attached-from-google-drivecloud-storage-in-android-file-gives-err-upload-file
        // as possible sources of the error (still not confirmed it is the same thing).
        try {
          const buffer = await fileArrayBuffer(file)
          const clone = new File([buffer], file.name, { type: file.type })

          /**
           * Set a custom field to force attachment field to remain dirty.
           * React Hook Form is unable to evaluate dirtiness file when comparing File objects https://react-hook-form.com/docs/useformstate#return
           * React Hook Form has a custom deepEqual comparator function that checks for key values on the object https://github.com/react-hook-form/react-hook-form/blob/v7.51.1/src/utils/deepEqual.ts
           * By introducing a new `__dirtyField` property, so we can set force the evaluation deepEqual to be false, thus remaining dirty.
           * */
          // @ts-expect-error __dirtyField is not a standard property of File.
          clone.__dirtyField = 1
          return onChange(clone)
        } catch (error) {
          setErrorMessage(
            'There was an error reading your file. If you are uploading a file and using online storage such as Google Drive, download your file before attaching the downloaded version. Otherwise, please refresh and try again.',
          )

          // For RUM error tracking
          datadogLogs.logger.error(
            `handleFileChange error: ${(error as Error)?.message}`,
          )

          return onChange(undefined) // Clear attachment and return
        }
      },
    [clearErrors, fieldName, setErrorMessage, schema.disabled],
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
            showDownload={showDownload}
            showRemove={!schema.disabled}
          />
        )}
        name={fieldName}
        rules={validationRules}
      />
    </FieldContainer>
  )
}
