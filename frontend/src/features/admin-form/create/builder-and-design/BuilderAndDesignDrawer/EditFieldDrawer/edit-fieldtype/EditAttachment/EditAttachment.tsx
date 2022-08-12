import { useCallback, useEffect, useMemo } from 'react'
import { Controller, RegisterOptions } from 'react-hook-form'
import { FormControl, Skeleton } from '@chakra-ui/react'
import { extend, pick } from 'lodash'

import { FormResponseMode } from '~shared/types'
import {
  AttachmentFieldBase,
  AttachmentSize,
  BasicField,
  FormFieldDto,
} from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import { SingleSelect } from '~components/Dropdown'
import type { ComboboxItem } from '~components/Dropdown/types'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { useCreateTabForm } from '~features/admin-form/create/builder-and-design/useCreateTabForm'

import { DrawerContentContainer } from '../common/DrawerContentContainer'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

import { AttachmentStackedBar } from './AttachmentStackedBar'

type EditAttachmentProps = EditFieldProps<AttachmentFieldBase>

const EDIT_ATTACHMENT_FIELD_KEYS = [
  'title',
  'description',
  'required',
  'attachmentSize',
] as const

type EditAttachmentKeys = typeof EDIT_ATTACHMENT_FIELD_KEYS[number]

type EditAttachmentInputs = Pick<AttachmentFieldBase, EditAttachmentKeys>

const transformAttachmentFieldToEditForm = (
  field: AttachmentFieldBase,
): EditAttachmentInputs => {
  return pick(field, EDIT_ATTACHMENT_FIELD_KEYS)
}

const transformAttachmentEditFormToField = (
  inputs: EditAttachmentInputs,
  originalField: AttachmentFieldBase,
): AttachmentFieldBase => {
  return extend({}, originalField, inputs)
}

export const EditAttachment = ({ field }: EditAttachmentProps): JSX.Element => {
  const { data: form } = useCreateTabForm()
  const {
    register,
    formState: { errors },
    control,
    getValues,
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
    trigger,
  } = useEditFieldForm<EditAttachmentInputs, AttachmentFieldBase>({
    field,
    transform: {
      input: transformAttachmentFieldToEditForm,
      output: transformAttachmentEditFormToField,
    },
  })

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

  const otherAttachmentsSize = useMemo(() => {
    if (!form?.form_fields) return 0
    return form.form_fields
      .filter(
        (ff): ff is FormFieldDto<AttachmentFieldBase> =>
          ff.fieldType === BasicField.Attachment && ff._id !== field._id,
      )
      .reduce((sum, ff) => sum + Number(ff.attachmentSize), 0)
  }, [field._id, form?.form_fields])

  const maxTotalSizeMb: number = useMemo(() => {
    if (!form?.responseMode) return 0
    switch (form.responseMode) {
      case FormResponseMode.Email:
        return Number(AttachmentSize.SevenMb)
      case FormResponseMode.Encrypt:
        return Number(AttachmentSize.TwentyMb)
    }
  }, [form?.responseMode])

  const attachmentSizeOptions: ComboboxItem[] = useMemo(() => {
    if (!form) return []
    let sizes: AttachmentSize[] = []

    if (form.responseMode === FormResponseMode.Email) {
      sizes = [
        AttachmentSize.OneMb,
        AttachmentSize.TwoMb,
        AttachmentSize.ThreeMb,
        AttachmentSize.FourMb,
        AttachmentSize.SevenMb,
      ]
    } else if (form.responseMode === FormResponseMode.Encrypt) {
      sizes = Object.values(AttachmentSize)
    }

    return sizes.map((size) => ({
      value: size,
      label: `${size} MB`,
    }))
  }, [form])

  const attachmentSizeValidationRule = useMemo(
    (): RegisterOptions => ({
      validate: (val) => {
        return (
          maxTotalSizeMb - otherAttachmentsSize >= Number(val) ||
          `You have exceeded your form's attachment size limit of ${maxTotalSizeMb} MB. Kindly reduce the size of your attachments.
`
        )
      },
    }),
    [maxTotalSizeMb, otherAttachmentsSize],
  )

  const validateAttachmentSize = useCallback(() => {
    trigger('attachmentSize')
  }, [trigger])

  // Validate on render in order to inform users when other attachments have
  // already hit the limit, so the user doesn't try to create this attachment
  // field before changing the other fields.
  useEffect(() => validateAttachmentSize(), [validateAttachmentSize])

  return (
    <DrawerContentContainer>
      <FormControl isRequired isReadOnly={isLoading} isInvalid={!!errors.title}>
        <FormLabel>Question</FormLabel>
        <Input autoFocus {...register('title', requiredValidationRule)} />
        <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading} isInvalid={!!errors.description}>
        <FormLabel>Description</FormLabel>
        <Textarea {...register('description')} />
        <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading}>
        <Toggle {...register('required')} label="Required" />
      </FormControl>
      <FormControl isReadOnly={isLoading} isInvalid={!!errors.attachmentSize}>
        <FormLabel isRequired>Attachment size</FormLabel>
        <Skeleton isLoaded={!!form}>
          <Controller
            control={control}
            rules={attachmentSizeValidationRule}
            name="attachmentSize"
            render={({ field: { onChange, ...rest } }) => (
              <SingleSelect
                isClearable={false}
                items={attachmentSizeOptions}
                onChange={(size) => {
                  onChange(size)
                  validateAttachmentSize()
                }}
                {...rest}
              />
            )}
          />
        </Skeleton>
        <FormErrorMessage>{errors?.attachmentSize?.message}</FormErrorMessage>
        <AttachmentStackedBar
          existingValues={form ? [otherAttachmentsSize] : undefined}
          newValue={Number(getValues('attachmentSize'))}
          max={maxTotalSizeMb}
        />
      </FormControl>
      <InlineMessage useMarkdown>
        View our [complete list](https://go.gov.sg/formsg-cwl) of accepted file
        types. Please also read our [FAQ on email
        reliability](https://go.gov.sg/form-email-reliability) relating to
        unaccepted file types.
      </InlineMessage>
      <FormFieldDrawerActions
        isLoading={isLoading}
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
    </DrawerContentContainer>
  )
}
