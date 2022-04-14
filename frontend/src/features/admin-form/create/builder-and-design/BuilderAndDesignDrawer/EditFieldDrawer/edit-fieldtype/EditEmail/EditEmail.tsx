import { useEffect, useMemo, useRef, useState } from 'react'
import { RegisterOptions } from 'react-hook-form'
import { Box, FormControl, useMergeRefs } from '@chakra-ui/react'
import { extend, pick } from 'lodash'

import { EmailFieldBase } from '~shared/types/field'
import { FormResponseMode } from '~shared/types/form'
import { validateEmailDomains } from '~shared/utils/email-domain-validation'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { useCreateTabForm } from '../../../../useCreateTabForm'
import { DrawerContentContainer } from '../common/DrawerContentContainer'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'
import { SPLIT_TEXTAREA_TRANSFORM } from '../common/utils'

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
  typeof EDIT_EMAIL_FIELD_KEYS[number]
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
    isSaveEnabled,
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

  const watchedIsVerifiable = watch('isVerifiable')
  const watchedHasAllowedEmailDomains = watch('hasAllowedEmailDomains')
  const watchedHasAutoReply = watch('autoReplyOptions.hasAutoReply')

  // Use separate state for whether toggle is enabled so we can disable
  // the toggle only after it is set to false. Otherwise, we get the
  // following bug:
  // 1. Enable both OTP verification and email domain validation
  // 2. Disable OTP verification
  // 3. Now hasAllowedEmailDomains is true but the toggle is disabled
  const [isDomainToggleEnabled, setIsDomainToggleEnabled] =
    useState(watchedIsVerifiable)

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
  useEffect(() => {
    // Verification must be enabled for domain validation
    // We cannot simply use setValue as it does not update
    // the UI
    if (!watchedIsVerifiable && watchedHasAllowedEmailDomains) {
      hasAllowedEmailDomainsRef.current?.click()
    }
    setIsDomainToggleEnabled(watchedIsVerifiable)
  }, [watchedIsVerifiable, watchedHasAllowedEmailDomains])

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
  const isPdfResponseEnabled = useMemo(
    () => form?.responseMode !== FormResponseMode.Encrypt,
    [form],
  )

  return (
    <DrawerContentContainer>
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
            description="OTP verification needs to be enabled first"
            isDisabled={!isDomainToggleEnabled}
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
        <FormControl isReadOnly={isLoading}>
          <Toggle
            {...register('autoReplyOptions.hasAutoReply')}
            label="Email confirmation"
          />
        </FormControl>
        {watchedHasAutoReply && (
          <>
            <FormControl isRequired isReadOnly={isLoading} mt="1.5rem">
              <FormLabel>Subject</FormLabel>
              <Input
                autoFocus
                {...register('autoReplyOptions.autoReplySubject')}
              />
            </FormControl>
            <FormControl isRequired isReadOnly={isLoading} mt="1.5rem">
              <FormLabel>Sender name</FormLabel>
              <Input {...register('autoReplyOptions.autoReplySender')} />
            </FormControl>
            <FormControl isReadOnly={isLoading} isRequired mt="1.5rem">
              <FormLabel>Content</FormLabel>
              <Textarea {...register('autoReplyOptions.autoReplyMessage')} />
            </FormControl>
            <FormControl isReadOnly={isLoading} mt="1.5rem">
              <Toggle
                {...register('autoReplyOptions.includeFormSummary')}
                label="Include PDF response"
                isDisabled={!isPdfResponseEnabled}
              />
            </FormControl>
          </>
        )}
      </Box>
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
