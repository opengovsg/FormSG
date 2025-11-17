import { useMemo, useRef } from 'react'
import { RegisterOptions } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, FormControl, useMergeRefs } from '@chakra-ui/react'
import { extend, pick } from 'lodash'

import { PaymentChannel } from '~shared/types'
import { EmailFieldBase } from '~shared/types/field'
import { FormResponseMode } from '~shared/types/form'
import { validateEmailDomains } from '~shared/utils/email-domain-validation'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { useUser } from '~features/user/queries'

import { CreatePageDrawerContentContainer } from '../../../../../common'
import { useCreateTabForm } from '../../../../useCreateTabForm'
import { SPLIT_TEXTAREA_TRANSFORM } from '../common/constants'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

const EDIT_EMAIL_FIELD_KEYS = [
  'title',
  'description',
  'required',
  'isVerifiable',
  'autoReplyOptions',
] as const

type EditEmailProps = EditFieldProps<EmailFieldBase>

type EditEmailInputs = Pick<
  EmailFieldBase,
  (typeof EDIT_EMAIL_FIELD_KEYS)[number]
> & {
  hasAllowedEmailDomains: boolean
  allowedEmailDomains: string
}

const transformEmailFieldToEditForm = (
  field: EmailFieldBase,
): EditEmailInputs => {
  const allowedEmailDomains = field.allowedEmailDomains
  return {
    ...pick(field, EDIT_EMAIL_FIELD_KEYS),
    hasAllowedEmailDomains: allowedEmailDomains.length > 0,
    allowedEmailDomains: SPLIT_TEXTAREA_TRANSFORM.input(allowedEmailDomains),
  }
}

const transformEmailEditFormToField = (
  inputs: EditEmailInputs,
  originalField: EmailFieldBase,
): EmailFieldBase => {
  const { allowedEmailDomains, hasAllowedEmailDomains, ...rest } = inputs
  return extend({}, originalField, rest, {
    hasAllowedEmailDomains,
    // Clear allowedEmailDomains when toggled off.
    allowedEmailDomains: hasAllowedEmailDomains
      ? SPLIT_TEXTAREA_TRANSFORM.output(allowedEmailDomains)
      : [],
  })
}

export const EditEmail = ({ field }: EditEmailProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
    buttonText,
    handleUpdateField,
    watch,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditEmailInputs, EmailFieldBase>({
    field,
    transform: {
      input: transformEmailFieldToEditForm,
      output: transformEmailEditFormToField,
    },
  })

  const watchedHasAllowedEmailDomains = watch('hasAllowedEmailDomains')
  const watchedHasAutoReply = watch('autoReplyOptions.hasAutoReply')

  const { user } = useUser()

  const requiredValidationRule = useMemo(
    () =>
      createBaseValidationRules<EditEmailInputs, 'title'>({
        required: true,
      }),
    [],
  )

  const allowedEmailDomainsRegister = useMemo(
    () => register('hasAllowedEmailDomains'),
    [register],
  )
  const hasAllowedEmailDomainsRef = useRef<HTMLInputElement>(null)
  const mergedAllowedEmailDomainsRef = useMergeRefs(
    hasAllowedEmailDomainsRef,
    allowedEmailDomainsRegister.ref,
  )

  const emailDomainsValidation = useMemo<
    RegisterOptions<EditEmailInputs, 'allowedEmailDomains'>
  >(
    () => ({
      ...requiredValidationRule,
      validate: {
        noDuplicate: (value) => {
          const split = SPLIT_TEXTAREA_TRANSFORM.output(value)
          return (
            new Set(split).size === split.length ||
            'Please remove duplicate email domains'
          )
        },
        noEmpty: (value) => {
          const split = SPLIT_TEXTAREA_TRANSFORM.output(value)
          return split.length > 0 || 'Please enter at least one email domain'
        },
        validEmailDomains: (value) => {
          const split = SPLIT_TEXTAREA_TRANSFORM.output(value)
          return (
            validateEmailDomains(split) ||
            'Please enter only valid email domains starting with @'
          )
        },
      },
    }),
    [requiredValidationRule],
  )

  const { data: form } = useCreateTabForm()

  const isEncryptMode = form?.responseMode === FormResponseMode.Encrypt
  const isPaymentDisabledForm =
    isEncryptMode &&
    form.payments_channel.channel !== PaymentChannel.Unconnected

  // For payment forms inclusion of PDF responses are disallowed
  const pdfResponseToggleDescription = isPaymentDisabledForm
    ? t(
        'features.adminForm.sidebar.fields.email.emailConfirmation.includePdfResponseWarning',
      )
    : t(
        'features.adminForm.sidebar.fields.email.emailConfirmation.includeResponseDescription',
      )

  // TODO: FRM-2172 Remove when respondent copy is out of beta
  const isToggleEmailConfirmationDisabled =
    form?.responseMode === FormResponseMode.Multirespondent &&
    !user?.betaFlags?.respondentCopy

  return (
    <CreatePageDrawerContentContainer>
      <FormControl isRequired isReadOnly={isLoading} isInvalid={!!errors.title}>
        <FormLabel>
          {t('features.adminForm.sidebar.fields.commonFieldComponents.title')}
        </FormLabel>
        <Input autoFocus {...register('title', requiredValidationRule)} />
        <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
      </FormControl>
      <FormControl
        isRequired
        isReadOnly={isLoading}
        isInvalid={!!errors.description}
      >
        <FormLabel>
          {t(
            'features.adminForm.sidebar.fields.commonFieldComponents.description',
          )}
        </FormLabel>
        <Textarea {...register('description')} />
        <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading}>
        <Toggle
          {...register('required')}
          label={t(
            'features.adminForm.sidebar.fields.commonFieldComponents.required',
          )}
        />
      </FormControl>
      <Box>
        <FormControl
          isReadOnly={isLoading}
          isDisabled={isToggleEmailConfirmationDisabled}
        >
          <Toggle
            {...register('autoReplyOptions.hasAutoReply')}
            description={t(
              'features.adminForm.sidebar.fields.email.emailConfirmation.description',
            )}
            label={t(
              'features.adminForm.sidebar.fields.email.emailConfirmation.title',
            )}
          />
        </FormControl>
        {watchedHasAutoReply && (
          <>
            <FormControl isReadOnly={isLoading} mt="1.5rem">
              <Toggle
                {...register('autoReplyOptions.includeFormSummary')}
                label={t(
                  'features.adminForm.sidebar.fields.email.emailConfirmation.includeResponse',
                )}
                description={pdfResponseToggleDescription}
                isDisabled={isPaymentDisabledForm}
              />
            </FormControl>
            <FormControl isRequired isReadOnly={isLoading} mt="1.5rem">
              <FormLabel>Subject</FormLabel>
              <Input
                autoFocus
                placeholder={t(
                  'features.adminForm.sidebar.fields.email.emailConfirmation.subject.placeholder',
                  { formTitle: form?.title },
                )}
                {...register('autoReplyOptions.autoReplySubject')}
              />
            </FormControl>
            <FormControl isRequired isReadOnly={isLoading} mt="1.5rem">
              <FormLabel>
                {t(
                  'features.adminForm.sidebar.fields.email.emailConfirmation.senderName.title',
                )}
              </FormLabel>
              <Input
                placeholder={form?.admin.agency.fullName}
                {...register('autoReplyOptions.autoReplySender')}
              />
            </FormControl>
            <FormControl isReadOnly={isLoading} isRequired mt="1.5rem">
              <FormLabel>
                {t(
                  'features.adminForm.sidebar.fields.email.emailConfirmation.content.title',
                )}
              </FormLabel>
              <Textarea
                placeholder={t(
                  'features.adminForm.sidebar.fields.email.emailConfirmation.content.placeholder',
                  { agencyName: form?.admin.agency.fullName },
                )}
                {...register('autoReplyOptions.autoReplyMessage')}
              />
            </FormControl>
          </>
        )}
      </Box>
      <FormControl isReadOnly={isLoading}>
        <Toggle
          {...register('isVerifiable')}
          label={t(
            'features.adminForm.sidebar.fields.email.otpVerification.title',
          )}
          description={t(
            'features.adminForm.sidebar.fields.email.otpVerification.description',
          )}
        />
      </FormControl>
      <Box>
        <FormControl isReadOnly={isLoading}>
          <Toggle
            {...allowedEmailDomainsRegister}
            ref={mergedAllowedEmailDomainsRef}
            label={t(
              'features.adminForm.sidebar.fields.email.restrictEmailDomains.title',
            )}
          />
        </FormControl>
        {watchedHasAllowedEmailDomains && (
          <FormControl
            isReadOnly={isLoading}
            isRequired
            isInvalid={!!errors.allowedEmailDomains}
            mt="1.5rem"
          >
            <FormLabel>
              {t(
                'features.adminForm.sidebar.fields.email.restrictEmailDomains.inputLabel',
              )}
            </FormLabel>
            <Textarea
              autoFocus
              {...register('allowedEmailDomains', emailDomainsValidation)}
              placeholder={t(
                'features.adminForm.sidebar.fields.email.restrictEmailDomains.placeholder',
              )}
            />
            <FormErrorMessage>
              {errors?.allowedEmailDomains?.message}
            </FormErrorMessage>
          </FormControl>
        )}
      </Box>
      <FormFieldDrawerActions
        isLoading={isLoading}
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
    </CreatePageDrawerContentContainer>
  )
}
