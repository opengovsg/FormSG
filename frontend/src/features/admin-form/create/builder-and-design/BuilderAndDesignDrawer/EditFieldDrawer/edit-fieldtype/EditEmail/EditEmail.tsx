import { useMemo, useRef } from 'react'
import { RegisterOptions } from 'react-hook-form'
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

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
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
    form.payments_channel.channel === PaymentChannel.Unconnected

  const isPdfResponseEnabled =
    form?.responseMode === FormResponseMode.Email || isPaymentDisabledForm

  const pdfResponseToggleDescription = isPdfResponseEnabled
    ? undefined
    : 'PDF responses are not supported for encrypt forms with active payment fields'

  // email confirmation is not supported on MRF
  const isToggleEmailConfirmationDisabled =
    form?.responseMode === FormResponseMode.Multirespondent &&
    !field.autoReplyOptions.hasAutoReply

  return (
    <CreatePageDrawerContentContainer>
      <FormControl isRequired isReadOnly={isLoading} isInvalid={!!errors.title}>
        <FormLabel>Question</FormLabel>
        <Input autoFocus {...register('title', requiredValidationRule)} />
        <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
      </FormControl>
      <FormControl
        isRequired
        isReadOnly={isLoading}
        isInvalid={!!errors.description}
      >
        <FormLabel>Description</FormLabel>
        <Textarea {...register('description')} />
        <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading}>
        <Toggle {...register('required')} label="Required" />
      </FormControl>
      <FormControl isReadOnly={isLoading}>
        <Toggle
          {...register('isVerifiable')}
          label="OTP verification"
          description="Respondents must verify by entering a code sent to them"
        />
      </FormControl>
      <Box>
        <FormControl isReadOnly={isLoading}>
          <Toggle
            {...allowedEmailDomainsRegister}
            ref={mergedAllowedEmailDomainsRef}
            label="Restrict email domains"
          />
        </FormControl>
        {watchedHasAllowedEmailDomains && (
          <FormControl
            isReadOnly={isLoading}
            isRequired
            isInvalid={!!errors.allowedEmailDomains}
            mt="1.5rem"
          >
            <FormLabel>Domains allowed</FormLabel>
            <Textarea
              autoFocus
              {...register('allowedEmailDomains', emailDomainsValidation)}
              placeholder={'@data.gov.sg\n@agency.gov.sg'}
            />
            <FormErrorMessage>
              {errors?.allowedEmailDomains?.message}
            </FormErrorMessage>
          </FormControl>
        )}
      </Box>
      <Box>
        <FormControl
          isReadOnly={isLoading}
          isDisabled={isToggleEmailConfirmationDisabled}
        >
          <Toggle
            {...register('autoReplyOptions.hasAutoReply')}
            description="Customise an email acknowledgement to respondents"
            label="Email confirmation"
          />
        </FormControl>
        {watchedHasAutoReply && (
          <>
            <FormControl isRequired isReadOnly={isLoading} mt="1.5rem">
              <FormLabel>Subject</FormLabel>
              <Input
                autoFocus
                placeholder="Default email subject"
                {...register('autoReplyOptions.autoReplySubject')}
              />
            </FormControl>
            <FormControl isRequired isReadOnly={isLoading} mt="1.5rem">
              <FormLabel>Sender name</FormLabel>
              <Input
                placeholder="Default sender name is your agency name"
                {...register('autoReplyOptions.autoReplySender')}
              />
            </FormControl>
            <FormControl isReadOnly={isLoading} isRequired mt="1.5rem">
              <FormLabel>Content</FormLabel>
              <Textarea
                placeholder="Default email body"
                {...register('autoReplyOptions.autoReplyMessage')}
              />
            </FormControl>
            <FormControl isReadOnly={isLoading} mt="1.5rem">
              <Toggle
                {...register('autoReplyOptions.includeFormSummary')}
                label="Include PDF response"
                description={pdfResponseToggleDescription}
                isDisabled={!isPdfResponseEnabled}
              />
            </FormControl>
          </>
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
