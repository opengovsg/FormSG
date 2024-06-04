import { useCallback, useEffect, useMemo } from 'react'
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { BiBulb } from 'react-icons/bi'
import { Flex, FormControl, Icon } from '@chakra-ui/react'
import { get, isEmpty, isEqual } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import {
  EmailFormSettings,
  FormResponseMode,
  FormStatus,
  StorageFormSettings,
} from '~shared/types/form'

import { GUIDE_FORM_MRF, GUIDE_PREVENT_EMAIL_BOUNCE } from '~constants/links'
import { useMdComponents } from '~hooks/useMdComponents'
import {
  OPTIONAL_ADMIN_EMAIL_VALIDATION_RULES,
  REQUIRED_ADMIN_EMAIL_VALIDATION_RULES,
} from '~utils/formValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import { MarkdownText } from '~components/MarkdownText'
import { TagInput } from '~components/TagInput'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormPayments, useAdminFormSettings } from '../queries'

interface EmailFormSectionProps {
  settings: EmailFormSettings | StorageFormSettings
}

export const EmailFormSection = ({
  settings,
}: EmailFormSectionProps): JSX.Element => {
  const initialEmailSet = useMemo(
    () => new Set(settings.emails),
    [settings.emails],
  )
  const formMethods = useForm({
    mode: 'onChange',
    defaultValues: { emails: settings.emails },
  })

  const {
    formState: { errors },
    reset,
  } = formMethods

  const { mutateFormEmails } = useMutateFormSettings()

  const isFormPublic = useMemo(
    () => settings.status === FormStatus.Public,
    [settings],
  )

  const { hasPaymentCapabilities } = useAdminFormPayments()

  const isEmailInputDisabled = useMemo(
    () =>
      isFormPublic ||
      (settings &&
        settings.responseMode === FormResponseMode.Encrypt &&
        hasPaymentCapabilities),
    [settings, isFormPublic, hasPaymentCapabilities],
  )

  const handleSubmitEmails = useCallback(
    ({ emails }: { emails: string[] }) => {
      if (isEqual(new Set(emails.filter(Boolean)), initialEmailSet)) return
      return mutateFormEmails.mutate(emails)
    },
    [initialEmailSet, mutateFormEmails],
  )

  useEffect(() => reset({ emails: settings.emails }), [settings.emails, reset])

  const emailModeDescription = `Add at least **2 recipients** to prevent loss of response.`
  const storageModeDescription = `FormSG securely stores responses in an encrypted format and does not retain any associated emails.`

  return (
    <>
      {isFormPublic ? (
        <InlineMessage marginBottom="16px">
          To change admin email recipients, close your form to new responses.
        </InlineMessage>
      ) : isEmailInputDisabled ? (
        <InlineMessage variant="error">
          To enable email notifications, please remove Payments fields from your
          form.
        </InlineMessage>
      ) : settings && settings.responseMode === FormResponseMode.Encrypt ? (
        <MRFAdvertisingInfobox />
      ) : null}
      <FormProvider {...formMethods}>
        <FormControl
          isInvalid={!isEmpty(errors)}
          isDisabled={isEmailInputDisabled}
        >
          <FormLabel
            isRequired={settings.responseMode === FormResponseMode.Email}
            useMarkdownForDescription
            description={
              (settings.responseMode === FormResponseMode.Email
                ? emailModeDescription
                : storageModeDescription) +
              ` Learn more on [how to guard against email bounces](${GUIDE_PREVENT_EMAIL_BOUNCE}).`
            }
          >
            Send an email copy of new responses
          </FormLabel>
          <AdminEmailRecipientsInput onSubmit={handleSubmitEmails} />
          <FormErrorMessage>{get(errors, 'emails.message')}</FormErrorMessage>
          <FormLabel.Description color="neutral.500" mt="0.5rem">
            Separate multiple email addresses with a comma
          </FormLabel.Description>
        </FormControl>
      </FormProvider>
    </>
  )
}

const MRFAdvertisingInfobox = () => {
  const mdComponents = useMdComponents()

  return (
    <Flex bg="primary.100" p="1rem">
      <Icon as={BiBulb} color="primary.500" fontSize="1.5rem" mr="0.5rem" />
      <MarkdownText
        components={mdComponents}
      >{`Require routing and approval? [Check out our new feature: Multi-respondent forms!](${GUIDE_FORM_MRF})`}</MarkdownText>
    </Flex>
  )
}

interface AdminEmailRecipientsInputProps {
  onSubmit: (params: { emails: string[] }) => void
}

const AdminEmailRecipientsInput = ({
  onSubmit,
}: AdminEmailRecipientsInputProps): JSX.Element => {
  const { getValues, setValue, control, handleSubmit } = useFormContext<{
    emails: string[]
    isRequired: boolean
  }>()

  const { data: settings } = useAdminFormSettings()

  const tagValidation = useMemo(() => isEmail, [])

  const handleBlur = useCallback(() => {
    // Get rid of bad tags before submitting.
    setValue(
      'emails',
      (getValues('emails') || []).filter((email) => tagValidation(email)),
    )
    handleSubmit(onSubmit)()
  }, [getValues, handleSubmit, onSubmit, setValue, tagValidation])

  return (
    <Controller
      control={control}
      name="emails"
      rules={
        settings?.responseMode === FormResponseMode.Email
          ? REQUIRED_ADMIN_EMAIL_VALIDATION_RULES
          : OPTIONAL_ADMIN_EMAIL_VALIDATION_RULES
      }
      render={({ field }) => (
        <TagInput
          {...(getValues('emails') && getValues('emails').length > 0
            ? {}
            : { placeholder: 'me@example.com' })}
          {...field}
          tagValidation={tagValidation}
          onBlur={handleBlur}
        />
      )}
    />
  )
}
