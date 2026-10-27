import { useCallback, useEffect, useMemo } from 'react'
import { Controller, RegisterOptions } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, Skeleton, Stack } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { extend, pick } from 'lodash'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode, FormStatus } from 'formsg-shared/types'
import {
  AttachmentFieldBase,
  AttachmentSize,
  BasicField,
  FormFieldDto,
} from 'formsg-shared/types/field'
import { VALID_EXTENSIONS } from 'formsg-shared/utils/file-validation'

import {
  ACCEPTED_FILETYPES_SPREADSHEET,
  GUIDE_EMAIL_RELIABILITY,
} from '~constants/links'
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
import { getAttachmentSizeLimit } from '~features/admin-form/create/builder-and-design/utils/getAttachmentSizeLimit'

import { CreatePageDrawerContentContainer } from '../../../../../common'
import { SPLIT_TEXTAREA_TRANSFORM } from '../common/constants'
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

type EditAttachmentKeys = (typeof EDIT_ATTACHMENT_FIELD_KEYS)[number]

// PROTOTYPE (attachments-v2): form-only inputs for the two new field settings.
type EditAttachmentInputs = Pick<AttachmentFieldBase, EditAttachmentKeys> & {
  hasAllowedFileTypes: boolean
  allowedFileTypes: string
  allowMultipleAttachments: boolean
}

/** Tidies one line of the box: "PDF" or "pdf" becomes ".pdf". */
const normaliseExtension = (line: string) => {
  const ext = line.trim().toLowerCase()
  return ext.startsWith('.') ? ext : `.${ext}`
}
const toExtensions = (text: string) =>
  SPLIT_TEXTAREA_TRANSFORM.output(text).map(normaliseExtension)

const transformAttachmentFieldToEditForm = (
  field: AttachmentFieldBase,
): EditAttachmentInputs => {
  return {
    ...pick(field, EDIT_ATTACHMENT_FIELD_KEYS),
    hasAllowedFileTypes: !!field.allowedFileTypes?.length,
    // An unrestricted field starts with every allowed type, so turning the
    // toggle on shows the full list for the admin to trim.
    allowedFileTypes: SPLIT_TEXTAREA_TRANSFORM.input(
      field.allowedFileTypes?.length
        ? field.allowedFileTypes
        : VALID_EXTENSIONS,
    ),
    allowMultipleAttachments: !!field.allowMultipleAttachments,
  }
}

const transformAttachmentEditFormToField = (
  inputs: EditAttachmentInputs,
  originalField: AttachmentFieldBase,
): AttachmentFieldBase => {
  const {
    hasAllowedFileTypes,
    allowedFileTypes,
    allowMultipleAttachments,
    ...rest
  } = inputs
  return extend({}, originalField, rest, {
    allowedFileTypes: hasAllowedFileTypes
      ? toExtensions(allowedFileTypes)
      : undefined,
    allowMultipleAttachments: allowMultipleAttachments || undefined,
  })
}

export const EditAttachment = ({ field }: EditAttachmentProps): JSX.Element => {
  const { t } = useTranslation()
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
    watch,
  } = useEditFieldForm<EditAttachmentInputs, AttachmentFieldBase>({
    field,
    transform: {
      input: transformAttachmentFieldToEditForm,
      output: transformAttachmentEditFormToField,
    },
  })

  const isAttachmentsV2 = useFeatureIsOn(featureFlags.attachmentsV2)
  const watchedHasAllowedFileTypes = watch('hasAllowedFileTypes')

  const allowedFileTypesValidationRule = useMemo(
    (): RegisterOptions<EditAttachmentInputs, 'allowedFileTypes'> => ({
      validate: (text) => {
        if (!getValues('hasAllowedFileTypes')) return true
        const types = toExtensions(text)
        if (types.length === 0) return 'Please enter at least one file type'
        if (types.some((ext) => !VALID_EXTENSIONS.includes(ext))) {
          return 'Please enter only valid file types starting with .'
        }
        return (
          new Set(types).size === types.length ||
          'Please remove duplicate file types'
        )
      },
    }),
    [getValues],
  )

  const requiredValidationRule = useMemo(
    () =>
      createBaseValidationRules<EditAttachmentInputs, 'title'>({
        required: true,
      }),
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

  const maxTotalSizeMb: number = useMemo(
    () => getAttachmentSizeLimit(form?.responseMode),
    [form?.responseMode],
  )

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
    } else {
      sizes = Object.values(AttachmentSize)
    }

    return sizes.map((size) => ({
      value: size,
      label: `${size} MB`,
    }))
  }, [form])

  const attachmentSizeValidationRule = useMemo(
    (): RegisterOptions<EditAttachmentInputs, 'attachmentSize'> => ({
      validate: (val) => {
        return (
          maxTotalSizeMb - otherAttachmentsSize >= Number(val) ||
          t('features.adminForm.sidebar.fields.attachment.error.exceedSize', {
            maxTotalSizeMb,
          })
        )
      },
    }),
    [maxTotalSizeMb, otherAttachmentsSize, t],
  )

  const validateAttachmentSize = useCallback(() => {
    trigger('attachmentSize')
  }, [trigger])

  // Validate on render in order to inform users when other attachments have
  // already hit the limit, so the user doesn't try to create this attachment
  // field before changing the other fields.
  useEffect(() => {
    if (!form) return
    validateAttachmentSize()
  }, [form, validateAttachmentSize])

  return (
    <CreatePageDrawerContentContainer>
      <FormControl isRequired isReadOnly={isLoading} isInvalid={!!errors.title}>
        <FormLabel>
          {t('features.adminForm.sidebar.fields.commonFieldComponents.title')}
        </FormLabel>
        <Input autoFocus {...register('title', requiredValidationRule)} />
        <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading} isInvalid={!!errors.description}>
        <FormLabel>
          {t(
            'features.adminForm.sidebar.fields.commonFieldComponents.description',
          )}
        </FormLabel>
        <Textarea {...register('description')} />
        <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading}>
        <Toggle {...register('required')} label="Required" />
      </FormControl>
      {isAttachmentsV2 ? (
        <FormControl
          isReadOnly={isLoading}
          isInvalid={!!errors.allowedFileTypes}
        >
          <Toggle
            {...register('hasAllowedFileTypes', {
              onChange: () => trigger('allowedFileTypes'),
            })}
            label="Restrict file types"
          />
          {watchedHasAllowedFileTypes ? (
            <Stack spacing="1rem" mt="1rem">
              <FormControl
                isReadOnly={isLoading}
                isRequired
                isInvalid={!!errors.allowedFileTypes}
              >
                <FormLabel>File types allowed</FormLabel>
                <Textarea
                  {...register(
                    'allowedFileTypes',
                    allowedFileTypesValidationRule,
                  )}
                  minH="12rem"
                />
                <FormErrorMessage>
                  {errors?.allowedFileTypes?.message}
                </FormErrorMessage>
              </FormControl>
              {form?.status === FormStatus.Public ? (
                <InlineMessage variant="warning">
                  This form is open. Respondents may no longer be able to upload
                  files they could before.
                </InlineMessage>
              ) : null}
            </Stack>
          ) : null}
        </FormControl>
      ) : null}
      {isAttachmentsV2 && form?.responseMode !== FormResponseMode.Email ? (
        <FormControl isReadOnly={isLoading}>
          <Toggle
            {...register('allowMultipleAttachments')}
            label="Allow respondent to add multiple attachments"
            description="Respondents can attach as many files as fit within the size limit."
          />
        </FormControl>
      ) : null}
      <FormControl
        id="attachmentSize"
        isReadOnly={isLoading}
        isInvalid={!!errors.attachmentSize}
      >
        <FormLabel isRequired>
          {isAttachmentsV2
            ? 'Maximum size of attachment(s)'
            : t('features.adminForm.sidebar.fields.attachment.maximumSize')}
        </FormLabel>
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
                  // Validate on each change so that appropriate error message
                  // is displayed when the attachment size bar also shows red
                  validateAttachmentSize()
                }}
                {...rest}
              />
            )}
          />
        </Skeleton>
        <FormErrorMessage>{errors?.attachmentSize?.message}</FormErrorMessage>
        <AttachmentStackedBar
          existingValue={form ? otherAttachmentsSize : undefined}
          newValue={Number(getValues('attachmentSize'))}
          max={maxTotalSizeMb}
        />
      </FormControl>
      <InlineMessage useMarkdown>
        {t('features.adminForm.sidebar.fields.attachment.info', {
          acceptedFileTypes: ACCEPTED_FILETYPES_SPREADSHEET,
          guideEmailReliability: GUIDE_EMAIL_RELIABILITY,
        })}
      </InlineMessage>
      <FormFieldDrawerActions
        isLoading={isLoading}
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
    </CreatePageDrawerContentContainer>
  )
}
