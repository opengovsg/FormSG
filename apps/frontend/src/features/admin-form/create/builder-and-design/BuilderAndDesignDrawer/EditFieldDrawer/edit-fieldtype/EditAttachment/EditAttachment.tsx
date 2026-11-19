import { useCallback, useEffect, useMemo } from 'react'
import { Controller, RegisterOptions } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, FormControl, Skeleton } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { extend, pick } from 'lodash'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types'
import {
  AttachmentFieldBase,
  AttachmentSize,
  BasicField,
  FormFieldDto,
} from 'formsg-shared/types/field'
import {
  allowsEveryFileType,
  isInvalidFileExtension,
  normaliseFileType,
  VALID_EXTENSIONS,
} from 'formsg-shared/utils/file-validation'

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
  'allowMultiple',
] as const

type EditAttachmentKeys = (typeof EDIT_ATTACHMENT_FIELD_KEYS)[number]

type EditAttachmentInputs = Pick<AttachmentFieldBase, EditAttachmentKeys> & {
  hasAllowedFileTypes: boolean
  allowedFileTypes: string
}

const tidyFileTypes = (fileTypes: string): string[] =>
  SPLIT_TEXTAREA_TRANSFORM.output(fileTypes).map(normaliseFileType)

const transformAttachmentFieldToEditForm = (
  field: AttachmentFieldBase,
): EditAttachmentInputs => {
  const hasAllowedFileTypes = !allowsEveryFileType(field.allowedFileTypes)
  return {
    ...pick(field, EDIT_ATTACHMENT_FIELD_KEYS),
    hasAllowedFileTypes,
    allowedFileTypes: SPLIT_TEXTAREA_TRANSFORM.input(
      hasAllowedFileTypes && field.allowedFileTypes
        ? field.allowedFileTypes
        : VALID_EXTENSIONS,
    ),
  }
}

const transformAttachmentEditFormToField = (
  inputs: EditAttachmentInputs,
  originalField: AttachmentFieldBase,
): AttachmentFieldBase => {
  const { hasAllowedFileTypes, allowedFileTypes, ...rest } = inputs
  const field: AttachmentFieldBase = extend({}, originalField, rest)
  if (hasAllowedFileTypes) {
    field.allowedFileTypes = tidyFileTypes(allowedFileTypes)
  } else if (field.allowedFileTypes) {
    field.allowedFileTypes = []
  }
  return field
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

  const isAttachmentsV2Enabled = useFeatureIsOn(featureFlags.attachmentsV2)
  const canTurnOnMultiple =
    isAttachmentsV2Enabled &&
    !!form &&
    form.responseMode !== FormResponseMode.Email
  const canAllowMultiple = canTurnOnMultiple || !!field.allowMultiple
  const allowMultiple = watch('allowMultiple')
  const isRestrictFileTypesEnabled = useFeatureIsOn(
    featureFlags.attachmentsRestrictFileTypes,
  )
  const canRestrictFileTypes =
    (isRestrictFileTypesEnabled &&
      !!form &&
      form.responseMode !== FormResponseMode.Email) ||
    !!field.allowedFileTypes?.length
  const hasAllowedFileTypes = watch('hasAllowedFileTypes')
  const savedField = form?.form_fields.find((ff) => ff._id === field._id)
  const wasSavedMultiple =
    savedField?.fieldType === BasicField.Attachment &&
    !!savedField.allowMultiple
  const isTurningOnMultipleWithWebhook =
    allowMultiple && !wasSavedMultiple && !!form?.webhook.url

  const requiredValidationRule = useMemo(
    () =>
      createBaseValidationRules<EditAttachmentInputs, 'title'>({
        required: true,
      }),
    [],
  )

  const allowedFileTypesValidationRule = useMemo(
    (): RegisterOptions<EditAttachmentInputs, 'allowedFileTypes'> => ({
      validate: {
        noEmpty: (value) =>
          tidyFileTypes(value).length > 0 ||
          t(
            'features.adminForm.sidebar.fields.attachment.restrictFileTypes.error.empty',
          ),
        validFileTypes: (value) => {
          const invalidFileTypes = tidyFileTypes(value).filter(
            isInvalidFileExtension,
          )
          return (
            invalidFileTypes.length === 0 ||
            t(
              'features.adminForm.sidebar.fields.attachment.restrictFileTypes.error.invalid',
              { fileTypes: invalidFileTypes.join(', ') },
            )
          )
        },
        noDuplicate: (value) => {
          const fileTypes = tidyFileTypes(value)
          return (
            new Set(fileTypes).size === fileTypes.length ||
            t(
              'features.adminForm.sidebar.fields.attachment.restrictFileTypes.error.duplicate',
            )
          )
        },
      },
    }),
    [t],
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
      {canAllowMultiple ? (
        <FormControl isReadOnly={isLoading}>
          <Toggle
            {...register('allowMultiple')}
            label={t(
              'features.adminForm.sidebar.fields.attachment.allowMultiple',
            )}
          />
        </FormControl>
      ) : null}
      {isTurningOnMultipleWithWebhook ? (
        <InlineMessage variant="warning">
          {t('features.adminForm.sidebar.fields.attachment.webhookWarning')}
        </InlineMessage>
      ) : null}
      {canRestrictFileTypes ? (
        <Box>
          <FormControl isReadOnly={isLoading}>
            <Toggle
              {...register('hasAllowedFileTypes')}
              label={t(
                'features.adminForm.sidebar.fields.attachment.restrictFileTypes.title',
              )}
            />
          </FormControl>
          {hasAllowedFileTypes ? (
            <FormControl
              isReadOnly={isLoading}
              isRequired
              isInvalid={!!errors.allowedFileTypes}
              mt="1.5rem"
            >
              <FormLabel>
                {t(
                  'features.adminForm.sidebar.fields.attachment.restrictFileTypes.inputLabel',
                )}
              </FormLabel>
              <Textarea
                autoFocus
                {...register(
                  'allowedFileTypes',
                  allowedFileTypesValidationRule,
                )}
                placeholder={t(
                  'features.adminForm.sidebar.fields.attachment.restrictFileTypes.placeholder',
                )}
              />
              <FormErrorMessage>
                {errors?.allowedFileTypes?.message}
              </FormErrorMessage>
            </FormControl>
          ) : null}
        </Box>
      ) : null}
      <FormControl
        id="attachmentSize"
        isReadOnly={isLoading}
        isInvalid={!!errors.attachmentSize}
      >
        <FormLabel isRequired>
          {allowMultiple
            ? t(
                'features.adminForm.sidebar.fields.attachment.maximumSizeMultiple',
              )
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
