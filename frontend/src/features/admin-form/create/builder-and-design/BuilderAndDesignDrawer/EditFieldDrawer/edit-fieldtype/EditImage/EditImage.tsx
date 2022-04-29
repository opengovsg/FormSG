import { useMemo } from 'react'
import { Controller } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'
import { extend, get, isEmpty, pick } from 'lodash'

import { ImageFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import {
  getByteFileSize,
  getReadableFileSize,
} from '~components/Field/Attachment/utils'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Textarea from '~components/Textarea'

import { DrawerContentContainer } from '../common/DrawerContentContainer'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

import { UploadImageInput } from './UploadImageInput'

type EditImageProps = EditFieldProps<ImageFieldBase>

const EDIT_IMAGE_KEYS = ['title', 'description'] as const

export type EditImageInputs = Pick<
  ImageFieldBase,
  typeof EDIT_IMAGE_KEYS[number]
> & {
  attachment?: Partial<{
    file: File
    srcUrl: ImageFieldBase['url']
  }>
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
  return {
    name: attachment?.file?.name ?? null,
    size: attachment?.file?.size
      ? getReadableFileSize(attachment.file.size)
      : null,
    url: attachment?.srcUrl ?? null,
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
  const {
    register,
    control,
    formState: { errors },
    isSaveEnabled,
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditImageInputs, ImageFieldBase>({
    field,
    transform: {
      input: transformImageFieldToEditForm,
      output: transformImageEditFormToField,
      preSubmit: (output) => {
        // TODO: Generate presigned url and update the url to the new one.
        return output
      },
    },
  })

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

  return (
    <DrawerContentContainer>
      <FormControl
        isRequired
        isReadOnly={isLoading}
        isInvalid={!isEmpty(errors.attachment)}
      >
        <FormLabel>Uploaded image</FormLabel>
        <Controller
          control={control}
          rules={{
            validate: (val) => {
              if (val?.file && val.srcUrl) return true
              return 'Please upload an image'
            },
          }}
          name="attachment"
          render={({ field }) => <UploadImageInput {...field} />}
        />
        <FormErrorMessage>{get(errors, 'attachment.message')}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading} isInvalid={!!errors.description}>
        <FormLabel isRequired>Description</FormLabel>
        <Textarea {...register('description', requiredValidationRule)} />
        <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
      </FormControl>
      <FormFieldDrawerActions
        isLoading={isLoading}
        isSaveEnabled={isSaveEnabled}
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
    </DrawerContentContainer>
  )
}
