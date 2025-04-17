import { useCallback, useEffect, useMemo } from 'react'
import {
  Controller,
  FormProvider,
  RegisterOptions,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, Heading, Stack } from '@chakra-ui/react'
import { get, isEmpty, isEqual } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import {
  EmailFormSettings,
  FormResponseMode,
  MultirespondentFormSettings,
  StorageFormSettings,
} from '~shared/types/form'

import {
  OPTIONAL_ADMIN_EMAIL_VALIDATION_RULES,
  REQUIRED_ADMIN_EMAIL_VALIDATION_RULES,
} from '~utils/formValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

import { RespondentCopyToggle } from './EmailNotificationsSection/RespondentCopyToggle'
import { RespondentCustomiseEmail } from './EmailNotificationsSection/RespondentCustomiseEmail'
import { RespondentWorkflowCompletionToggle } from './EmailNotificationsSection/RespondentWorkflowCompletionToggle'
import { CategorySubHeader } from './CategorySubHeader'

interface EmailFormSectionProps {
  isDisabled: boolean
  settings:
    | EmailFormSettings
    | StorageFormSettings
    | MultirespondentFormSettings
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

  const EMAILS_FIELD_NAME = 'emails'

  const { data: settings } = useAdminFormSettings()

  const handleBlur = useCallback(() => {
    // Get rid of bad tags before submitting.
    setValue(
      EMAILS_FIELD_NAME,
      (getValues(EMAILS_FIELD_NAME) || []).filter((email) => isEmail(email)),
    )
    handleSubmit(onSubmit)()
  }, [getValues, handleSubmit, onSubmit, setValue])

  const emailsFieldPlaceholder =
    getValues(EMAILS_FIELD_NAME)?.length > 0 ? undefined : 'me@example.com'

  return (
    <Controller<{ emails: string[]; isRequired: boolean }>
      control={control}
      name={EMAILS_FIELD_NAME}
      rules={
        (settings?.responseMode === FormResponseMode.Email
          ? REQUIRED_ADMIN_EMAIL_VALIDATION_RULES
          : OPTIONAL_ADMIN_EMAIL_VALIDATION_RULES) as RegisterOptions<{
          emails: string[]
          isRequired: boolean
        }>
      }
      render={({ field }) => (
        <TagInput
          placeholder={emailsFieldPlaceholder}
          {...field}
          value={field.value as string[]}
          tagValidation={isEmail}
          onBlur={handleBlur}
        />
      )}
    />
  )
}

// MRF NewResponsesInput will update emails to receive per-step responses
interface MrfNewResponseRecipientsInputProps {
  onSubmit: (params: { newResponseEmails: string[] }) => void
}

const MrfNewResponseRecipientsInput = ({
  onSubmit,
}: MrfNewResponseRecipientsInputProps): JSX.Element => {
  const { getValues, setValue, control, handleSubmit } = useFormContext<{
    newResponseEmails: string[]
    isRequired: boolean
  }>()

  const EMAILS_FIELD_NAME = 'newResponseEmails'

  const handleBlur = useCallback(() => {
    // Get rid of bad tags before submitting.
    setValue(
      EMAILS_FIELD_NAME,
      (getValues(EMAILS_FIELD_NAME) || []).filter((email) => isEmail(email)),
    )
    handleSubmit(onSubmit)()
  }, [getValues, handleSubmit, onSubmit, setValue])

  const emailsFieldPlaceholder =
    getValues(EMAILS_FIELD_NAME)?.length > 0 ? undefined : 'me@example.com'

  return (
    <Controller<{ newResponseEmails: string[]; isRequired: boolean }>
      control={control}
      name={EMAILS_FIELD_NAME}
      rules={
        OPTIONAL_ADMIN_EMAIL_VALIDATION_RULES as RegisterOptions<{
          newResponseEmails: string[]
          isRequired: boolean
        }>
      }
      render={({ field }) => (
        <TagInput
          placeholder={emailsFieldPlaceholder}
          {...field}
          value={field.value as string[]}
          tagValidation={isEmail}
          onBlur={handleBlur}
        />
      )}
    />
  )
}

export const FormEmailNotificationsSection = ({
  isDisabled,
  settings,
}: EmailFormSectionProps): JSX.Element => {
  const { t } = useTranslation()
  const initialEmailSet = useMemo(
    () => new Set(settings.emails),
    [settings.emails],
  )

  const intialMrfNewResponseEmailSet = useMemo(() => {
    if ('mrfNewResponseEmails' in settings) {
      return new Set(settings.mrfNewResponseEmails ?? [])
    }
    return new Set()
  }, [settings])

  const formMethods = useForm({
    mode: 'onChange',
    defaultValues: {
      emails: settings.emails,
      newResponseEmails: [],
      //   mrfWorkflowCompletionEmails: settings.mrfAdminWorkflowCompletionEmails,
      mrfWorkflowCompletionEmails: [],
    },
  })

  const {
    formState: { errors },
    reset,
  } = formMethods

  const { mutateFormEmails, mutateFormMrfNewResponseEmails } =
    useMutateFormSettings()

  const handleSubmitEmails = useCallback(
    ({ emails }: { emails: string[] }) => {
      if (isEqual(new Set(emails.filter(Boolean)), initialEmailSet)) return
      return mutateFormEmails.mutate(emails)
    },
    [initialEmailSet, mutateFormEmails],
  )

  const handleSubmitMrfNewResponseEmails = useCallback(
    ({ newResponseEmails }: { newResponseEmails: string[] }) => {
      if (
        isEqual(
          new Set(newResponseEmails.filter(Boolean)),
          intialMrfNewResponseEmailSet,
        )
      )
        return
      return mutateFormMrfNewResponseEmails.mutate(newResponseEmails)
    },
    [intialMrfNewResponseEmailSet, mutateFormMrfNewResponseEmails],
  )

  useEffect(() => reset({ emails: settings.emails }), [settings.emails, reset])

  const isMrf = settings.responseMode === FormResponseMode.Multirespondent

  const DESCRIPTION_TEXT = t(
    'features.adminForm.settings.emailNotifications.section.regular.info',
  )

  return (
    <>
      <FormProvider {...formMethods}>
        <CategorySubHeader>Admin</CategorySubHeader>
        {!isMrf && (
          <FormControl isInvalid={!isEmpty(errors)} isDisabled={isDisabled}>
            <FormLabel useMarkdownForDescription description={DESCRIPTION_TEXT}>
              {t(
                'features.adminForm.settings.emailNotifications.section.regular.label',
              )}
            </FormLabel>
            <AdminEmailRecipientsInput onSubmit={handleSubmitEmails} />
            <FormErrorMessage>{get(errors, 'emails.message')}</FormErrorMessage>
            {isEmpty(errors) ? (
              <FormLabel.Description
                color="secondary.400"
                mt="0.5rem"
                opacity={isDisabled ? '0.3' : '1'}
              >
                {t(
                  'features.adminForm.settings.emailNotifications.section.regular.description',
                )}
              </FormLabel.Description>
            ) : null}
          </FormControl>
        )}
        {isMrf && (
          <Stack spacing={'1.5rem'}>
            <FormControl isInvalid={!isEmpty(errors)} isDisabled={isDisabled}>
              <FormLabel
                useMarkdownForDescription
                description={DESCRIPTION_TEXT}
              >
                {t(
                  'features.adminForm.settings.emailNotifications.section.regular.label',
                )}
              </FormLabel>
              <MrfNewResponseRecipientsInput
                onSubmit={handleSubmitMrfNewResponseEmails}
              />
              <FormErrorMessage>
                {get(errors, 'mrfWorkflowOutcomeEmails.message')}
              </FormErrorMessage>
              {isEmpty(errors) ? (
                <FormLabel.Description
                  color="secondary.400"
                  mt="0.5rem"
                  opacity={isDisabled ? '0.3' : '1'}
                >
                  {t(
                    'features.adminForm.settings.emailNotifications.section.regular.description',
                  )}
                </FormLabel.Description>
              ) : null}
            </FormControl>
            <FormControl isInvalid={!isEmpty(errors)} isDisabled={isDisabled}>
              <FormLabel
                useMarkdownForDescription
                description={t(
                  'features.adminForm.settings.emailNotifications.section.mrf.admin.workflowCompletionInfo',
                )}
              >
                {t(
                  'features.adminForm.settings.emailNotifications.section.mrf.admin.workflowCompletionLabel',
                )}
              </FormLabel>
              <AdminEmailRecipientsInput onSubmit={handleSubmitEmails} />
              <FormErrorMessage>
                {get(errors, 'emails.message')}
              </FormErrorMessage>
              {isEmpty(errors) ? (
                <FormLabel.Description
                  color="secondary.400"
                  mt="0.5rem"
                  opacity={isDisabled ? '0.3' : '1'}
                >
                  {t(
                    'features.adminForm.settings.emailNotifications.section.regular.description',
                  )}
                </FormLabel.Description>
              ) : null}
            </FormControl>
          </Stack>
        )}

        <CategorySubHeader mt={'3rem'}>Respondent</CategorySubHeader>
        <Stack spacing={'1.5rem'}>
          <RespondentCopyToggle />
          {isMrf && <RespondentWorkflowCompletionToggle />}
          <RespondentCustomiseEmail />
        </Stack>
      </FormProvider>
    </>
  )
}
