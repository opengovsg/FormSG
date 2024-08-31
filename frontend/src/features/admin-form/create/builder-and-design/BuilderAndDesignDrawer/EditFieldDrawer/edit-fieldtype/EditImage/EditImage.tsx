import { useCallback, useMemo } from 'react'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useMutation } from 'react-query'
import { useParams } from 'react-router-dom'
import { FormControl } from '@chakra-ui/react'
import { extend, get, isEmpty, pick } from 'lodash'

import { MB } from '~shared/constants/file'
import { ImageFieldBase } from '~shared/types/field'

import { useToast } from '~hooks/useToast'
import { createBaseValidationRules } from '~utils/fieldValidation'
import { uploadImage } from '~services/FileHandlerService'
import {
  getByteFileSize,
  getReadableFileSize,
} from '~components/Field/Attachment/utils'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Textarea from '~components/Textarea'

import { CreatePageDrawerContentContainer } from '../../../../../common'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

import { UploadedImage, UploadImageInput } from './UploadImageInput'

type EditImageProps = EditFieldProps<ImageFieldBase>

const EDIT_IMAGE_KEYS = ['title', 'description'] as const

export type EditImageInputs = Pick<
  ImageFieldBase,
  (typeof EDIT_IMAGE_KEYS)[number]
> & {
  attachment?: UploadedImage
}

const transformImageFieldToEditForm = (
  inputField: ImageFieldBase,
): EditImageInputs => {
  return {
    ...pick(inputField, EDIT_IMAGE_KEYS),
    attachment: {
      // Store both file and its url for easy manipulation when submitting.
      file: inputField.name
        ? Object.defineProperty(
            new File([''], inputField.name, { type: 'image/jpeg' }),
            'size',
            { value: getByteFileSize(inputField.size) },
          )
        : undefined,
      srcUrl: inputField.url,
    },
  }
}

const transformAttachmentInputToDto = (
  attachment: EditImageInputs['attachment'],
) => {
  if (!attachment?.file || !attachment?.srcUrl) {
    return {
      name: null,
      size: null,
      url: null,
    }
  }

  return {
    name: attachment.file.name,
    size: getReadableFileSize(attachment.file.size),
    url: attachment.srcUrl,
  }
}

const transformImageEditFormToField = (
  { attachment, ...formOutput }: EditImageInputs,
  originalField: ImageFieldBase,
): ImageFieldBase => {
  // TODO: Upload attachment to AWS S3 before sending it to the server.
  return extend({}, originalField, {
    ...formOutput,
    ...transformAttachmentInputToDto(attachment),
  })
}

export const EditImage = ({ field }: EditImageProps): JSX.Element => {
  const { t } = useTranslation()
  const toast = useToast({ status: 'danger' })
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const uploadImageMutation = useMutation((image: File) =>
    uploadImage({ formId, image }),
  )

  const preSubmitTransform = useCallback(
    (
      inputs: EditImageInputs,
      output: ImageFieldBase,
    ): ImageFieldBase | Promise<ImageFieldBase> => {
      // No upload is required.
      if (
        !inputs.attachment?.file ||
        !inputs.attachment?.srcUrl?.startsWith('blob:')
      ) {
        return output
      }
      return uploadImageMutation
        .mutateAsync(inputs.attachment.file)
        .then((uploadedFileData) => {
          return {
            ...output,
            ...uploadedFileData,
            size: `${(uploadedFileData.size / MB).toFixed(2)} MB`,
          }
        })
    },
    [uploadImageMutation],
  )

  const {
    register,
    control,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditImageInputs, ImageFieldBase>({
    field,
    transform: {
      input: transformImageFieldToEditForm,
      output: transformImageEditFormToField,
      preSubmit: preSubmitTransform,
    },
  })

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

  // Required to override original updateField function due to possible errors
  // from the generation of presigned urls.
  const handleUpdateFieldWithCatch = useCallback(
    () =>
      handleUpdateField().catch((error) => {
        toast({ description: error.message })
      }),
    [handleUpdateField, toast],
  )

  return (
    <CreatePageDrawerContentContainer>
      <FormControl
        isRequired
        isReadOnly={isLoading || isSubmitting}
        isInvalid={!isEmpty(errors.attachment)}
      >
        <FormLabel>
          {t('features.adminForm.sidebar.fields.imageAttachment.title')}
        </FormLabel>
        <Controller
          control={control}
          rules={{
            validate: (val) => {
              if (val?.file && val.srcUrl) return true
              return t(
                'features.adminForm.sidebar.fields.imageAttachment.requiredError',
              )
            },
          }}
          name="attachment"
          render={({ field: { onChange, ...field } }) => (
            <UploadImageInput
              {...field}
              onChange={(event) => {
                clearErrors('attachment')
                onChange(event)
              }}
              onError={(message) => setError('attachment', { message })}
            />
          )}
        />
        <FormErrorMessage>{get(errors, 'attachment.message')}</FormErrorMessage>
      </FormControl>
      <FormControl
        isReadOnly={isLoading || isSubmitting}
        isInvalid={!!errors.description}
      >
        <FormLabel isRequired>Description</FormLabel>
        <Textarea {...register('description', requiredValidationRule)} />
        <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
      </FormControl>
      <FormFieldDrawerActions
        isLoading={isLoading || isSubmitting}
        buttonText={buttonText}
        handleClick={handleUpdateFieldWithCatch}
        handleCancel={handleCancel}
      />
    </CreatePageDrawerContentContainer>
  )
}
