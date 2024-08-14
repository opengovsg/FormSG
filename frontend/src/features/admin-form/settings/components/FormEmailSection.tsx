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

import { PaymentChannel } from '~shared/types'
import {
  EmailFormSettings,
  FormResponseMode,
  FormStatus,
  StorageFormSettings,
} from '~shared/types/form'

import {
  GUIDE_FORM_MRF,
  GUIDE_PREVENT_EMAIL_BOUNCE,
  OGP_PLUMBER,
} from '~constants/links'
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
import { useAdminFormSettings } from '../queries'

interface EmailFormSectionProps {
  settings: EmailFormSettings | StorageFormSettings
}

export const FormEmailSection = ({
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

  const isFormPublic = settings.status === FormStatus.Public

  const isPaymentsEnabled =
    settings &&
    settings.responseMode === FormResponseMode.Encrypt &&
    (settings.payments_channel.channel !== PaymentChannel.Unconnected ||
      settings.payments_field.enabled)

  const isEmailsDisabled = isFormPublic || isPaymentsEnabled

  const handleSubmitEmails = useCallback(
    ({ emails }: { emails: string[] }) => {
      if (isEqual(new Set(emails.filter(Boolean)), initialEmailSet)) return
      return mutateFormEmails.mutate(emails)
    },
    [initialEmailSet, mutateFormEmails],
  )

  useEffect(() => reset({ emails: settings.emails }), [settings.emails, reset])

  const isEmailMode = settings.responseMode === FormResponseMode.Email

  const emailModeDescription = `Add at least **2 recipients** to prevent loss of response.`
  const storageModeDescription = `FormSG securely stores responses in an encrypted format and does not retain any associated emails.`

  return (
    <>
      <EmailNotificationsHeader
        isFormPublic={isFormPublic}
        isPaymentsEnabled={isPaymentsEnabled}
        isFormResponseModeEmail={isEmailMode}
      />
      <FormProvider {...formMethods}>
        <FormControl isInvalid={!isEmpty(errors)} isDisabled={isEmailsDisabled}>
          <FormLabel
            isRequired={isEmailMode}
            useMarkdownForDescription
            description={
              (isEmailMode ? emailModeDescription : storageModeDescription) +
              ` Learn more on [how to guard against email bounces](${GUIDE_PREVENT_EMAIL_BOUNCE}).`
            }
          >
            Send an email copy of new responses
          </FormLabel>
          <AdminEmailRecipientsInput
            onSubmit={handleSubmitEmails}
            isEmailsDisabled={isEmailsDisabled}
          />
          <FormErrorMessage>{get(errors, 'emails.message')}</FormErrorMessage>
          {isEmpty(errors) ? (
            <FormLabel.Description
              color="secondary.400"
              mt="0.5rem"
              opacity={isEmailsDisabled ? '0.3' : '1'}
            >
              Separate multiple email addresses with a comma
            </FormLabel.Description>
          ) : null}
        </FormControl>
      </FormProvider>
    </>
  )
}

const MRFAdvertisingInfobox = () => {
  const mdComponents = useMdComponents()

  return (
    <Flex bg="primary.100" p="1rem" marginBottom="40px">
      <Icon as={BiBulb} color="primary.500" fontSize="1.5rem" mr="0.5rem" />
      <MarkdownText
        components={mdComponents}
      >{`Require routing and approval? [Check out our new feature: Multi-respondent forms!](${GUIDE_FORM_MRF})`}</MarkdownText>
    </Flex>
  )
}

interface EmailNotificationsHeaderProps {
  isFormPublic: boolean
  isPaymentsEnabled: boolean
  isFormResponseModeEmail: boolean
}

const EmailNotificationsHeader = ({
  isFormPublic,
  isPaymentsEnabled,
  isFormResponseModeEmail,
}: EmailNotificationsHeaderProps) => {
  if (isFormPublic) {
    return (
      <InlineMessage marginBottom="40px">
        To change admin email recipients, close your form to new responses.
      </InlineMessage>
    )
  }

  if (isPaymentsEnabled) {
    return (
      <InlineMessage useMarkdown marginBottom="40px">
        {`Email notifications for payment forms are not available in FormSG. You can configure them using [Plumber](${OGP_PLUMBER}).`}
      </InlineMessage>
    )
  }

  if (isFormResponseModeEmail) {
    return <MRFAdvertisingInfobox />
  }

  return null
}

interface AdminEmailRecipientsInputProps {
  onSubmit: (params: { emails: string[] }) => void
  isEmailsDisabled: boolean
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
          {...(getValues('emails')?.length > 0
            ? {}
            : {
                placeholder: 'me@example.com',
              })}
          {...field}
          tagValidation={tagValidation}
          onBlur={handleBlur}
        />
      )}
    />
  )
}
