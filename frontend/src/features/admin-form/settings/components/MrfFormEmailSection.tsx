import { useCallback } from 'react'
import { Controller, RegisterOptions, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Box,
  FormControl,
  FormErrorMessage,
  Skeleton,
  Text,
} from '@chakra-ui/react'
import { get, isEmpty, isEqual, uniq } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { MultirespondentFormSettings } from '~shared/types/form'

import { useOptionalAdminEmailValidationRules } from '~utils/formValidation'
import { MultiSelect, SingleSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { useAdminFormWorkflow } from '~features/admin-form/create/workflow/hooks/useAdminFormWorkflow'
import { useUser } from '~features/user/queries'

import { useMutateFormSettings } from '../mutations'

import { RespondentCopyToggle } from './EmailNotificationsSection/RespondentCopyToggle'

interface MrfEmailNotificationsFormProps {
  settings: MultirespondentFormSettings
  isDisabled: boolean
  isHighContrast: boolean
}

const WORKFLOW_EMAIL_MULTISELECT_NAME = 'email-multi-select'
const STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME =
  'step-1-notify-single-select'
const OTHER_PARTIES_EMAIL_INPUT_NAME = 'other-parties-email-input'

interface FormData {
  [WORKFLOW_EMAIL_MULTISELECT_NAME]: string[]
  [OTHER_PARTIES_EMAIL_INPUT_NAME]: string[]
  [STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]: string
}

const MrfEmailNotificationsForm = ({
  settings,
  isDisabled,
  isHighContrast,
}: MrfEmailNotificationsFormProps) => {
  const { t } = useTranslation()
  const {
    isLoading,
    formWorkflow,
    emailFormFields = [],
  } = useAdminFormWorkflow()

  //TODO: (Respondent Copy): Remove isTest and user when respondent copy is out of beta
  const { user } = useUser()
  const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'

  const formWorkflowStepsWithStepNumber =
    formWorkflow?.map((step, index) => ({
      ...step,
      stepNumber: index + 1,
    })) ?? []

  const emailFieldItems = emailFormFields.map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )

  const filterInvalidEmails = useCallback((emails: string[]) => {
    if (!emails) return []
    return emails.filter((email) => isEmail(email))
  }, [])

  const { stepsToNotify, emails, stepOneEmailNotificationFieldId } = settings

  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<{
    [STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]: string
    [WORKFLOW_EMAIL_MULTISELECT_NAME]: string[]
    [OTHER_PARTIES_EMAIL_INPUT_NAME]: string[]
  }>({
    defaultValues: {
      [WORKFLOW_EMAIL_MULTISELECT_NAME]: stepsToNotify,
      [OTHER_PARTIES_EMAIL_INPUT_NAME]: emails,
      [STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]:
        stepOneEmailNotificationFieldId,
    },
  })

  const { mutateMrfEmailNotifications } = useMutateFormSettings()

  const handleSubmitEmailNotificationSettings = ({
    nextStaticEmails,
    nextStepsToNotify,
    nextStepOneEmailNotificationFieldId,
  }: {
    nextStaticEmails: string[]
    nextStepsToNotify: string[]
    nextStepOneEmailNotificationFieldId: string
  }) => {
    if (
      isEqual(nextStaticEmails, emails) &&
      isEqual(nextStepsToNotify, stepsToNotify) &&
      nextStepOneEmailNotificationFieldId === stepOneEmailNotificationFieldId
    ) {
      return
    }
    return mutateMrfEmailNotifications.mutate({
      emails: nextStaticEmails,
      stepsToNotify: nextStepsToNotify,
      stepOneEmailNotificationFieldId: nextStepOneEmailNotificationFieldId,
    })
  }

  const onSubmit = (formData: FormData) => {
    const selectedSteps = formData[WORKFLOW_EMAIL_MULTISELECT_NAME]
    const selectedEmails = formData[OTHER_PARTIES_EMAIL_INPUT_NAME]
    const selectedStepOneEmailNotificationFieldId =
      formData[STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]

    return handleSubmitEmailNotificationSettings({
      nextStepsToNotify: selectedSteps,
      nextStaticEmails: selectedEmails,
      nextStepOneEmailNotificationFieldId:
        selectedStepOneEmailNotificationFieldId,
    })
  }

  const handleOtherPartiesEmailInputBlur = () => {
    const uniqueValidEmails = uniq(
      filterInvalidEmails(getValues(OTHER_PARTIES_EMAIL_INPUT_NAME)),
    )
    setValue(OTHER_PARTIES_EMAIL_INPUT_NAME, uniqueValidEmails)
    handleSubmit(onSubmit)()
  }

  const otherPartiesEmailInputPlaceholder =
    getValues(OTHER_PARTIES_EMAIL_INPUT_NAME)?.length > 0
      ? undefined
      : 'me@example.com'

  const optionalAdminEmailValidationRules =
    useOptionalAdminEmailValidationRules()

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box>
        <Text textStyle="body-1" textColor="secondary.700" mb="1.5rem">
          {t(
            'features.adminForm.settings.emailNotifications.section.mrf.selectRecipient',
          )}
        </Text>
        <Box>
          <FormLabel mb="0.75rem" textColor="secondary.700">
            {t(
              'features.adminForm.settings.emailNotifications.section.mrf.respondents.step1.label',
            )}
          </FormLabel>
          <Skeleton isLoaded={!isLoading}>
            <Controller
              control={control}
              name={STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME}
              render={({
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                field: { value, onBlur, ...rest },
              }) => (
                <SingleSelect
                  isDisabled={isLoading || isDisabled}
                  placeholder={t(
                    'features.adminForm.settings.emailNotifications.section.mrf.respondents.step1.placeholder',
                  )}
                  items={emailFieldItems}
                  onBlur={handleSubmit(onSubmit)}
                  isClearable
                  value={value}
                  {...rest}
                />
              )}
            />
          </Skeleton>
        </Box>
        <Box my="1.5rem">
          <FormLabel mb="0.75rem" textColor="secondary.700">
            {t(
              'features.adminForm.settings.emailNotifications.section.mrf.respondents.stepN.label.overall',
            )}
          </FormLabel>
          <Skeleton isLoaded={!isLoading}>
            <Controller
              control={control}
              name={WORKFLOW_EMAIL_MULTISELECT_NAME}
              render={({
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                field: { value: values = [], onChange, onBlur, ...rest },
              }) => (
                <MultiSelect
                  items={formWorkflowStepsWithStepNumber
                    .filter((step) => step.stepNumber > 1)
                    .map(({ step_name, stepNumber, _id: value }) => ({
                      label:
                        t(
                          'features.adminForm.settings.emailNotifications.section.mrf.respondents.stepN.label.each',
                          { stepNumber },
                        ) + (step_name ? ` (${step_name})` : ''),
                      value,
                    }))}
                  values={values}
                  onChange={onChange}
                  onBlur={handleSubmit(onSubmit)}
                  placeholder={
                    isDisabled
                      ? null
                      : t(
                          'features.adminForm.settings.emailNotifications.section.mrf.respondents.stepN.placeholder',
                        )
                  }
                  isSelectedItemFullWidth
                  isDisabled={isLoading || isDisabled}
                  {...rest}
                />
              )}
            />
          </Skeleton>
        </Box>
      </Box>
      <Box my="1.5rem">
        <FormControl
          isInvalid={!isEmpty(errors[OTHER_PARTIES_EMAIL_INPUT_NAME])}
          isDisabled={isDisabled}
        >
          <FormLabel
            textColor="secondary.700"
            mb="0.75rem"
            tooltipVariant="info"
            tooltipPlacement="top"
            tooltipText={t(
              'features.adminForm.settings.emailNotifications.section.mrf.respondents.others.tooltipText',
            )}
            isHighContrast={isHighContrast}
          >
            {t(
              'features.adminForm.settings.emailNotifications.section.mrf.respondents.others.label',
            )}
          </FormLabel>
          <Controller<FormData>
            name={OTHER_PARTIES_EMAIL_INPUT_NAME}
            control={control}
            rules={
              optionalAdminEmailValidationRules as RegisterOptions<FormData>
            }
            render={({ field }) => (
              <TagInput
                placeholder={
                  isDisabled ? undefined : otherPartiesEmailInputPlaceholder
                }
                {...field}
                value={field.value as string[]}
                isDisabled={isDisabled}
                onBlur={handleOtherPartiesEmailInputBlur}
                tagValidation={isEmail}
              />
            )}
          />
          {isEmpty(errors[OTHER_PARTIES_EMAIL_INPUT_NAME]) ? (
            <FormLabel.Description color="secondary.400" mt="0.5rem">
              {t(
                'features.adminForm.settings.emailNotifications.section.mrf.respondents.others.description',
              )}
            </FormLabel.Description>
          ) : (
            <FormErrorMessage>
              {get(errors, `${OTHER_PARTIES_EMAIL_INPUT_NAME}.message`)}
            </FormErrorMessage>
          )}
        </FormControl>
        {isTest || user?.betaFlags?.respondentCopy ? (
          <FormControl isDisabled={isDisabled}>
            <Box mt={'1.5rem'}>
              <RespondentCopyToggle />
            </Box>
          </FormControl>
        ) : null}
      </Box>
    </form>
  )
}

interface MrfFormEmailSectionProps {
  settings: MultirespondentFormSettings
  isDisabled: boolean
  isHighContrast?: boolean
}

export const MrfFormEmailSection = ({
  settings,
  isDisabled,
  isHighContrast = true,
}: MrfFormEmailSectionProps): JSX.Element => {
  return (
    <Box opacity={1}>
      <MrfEmailNotificationsForm
        settings={settings}
        isDisabled={isDisabled}
        isHighContrast={isHighContrast}
      />
    </Box>
  )
}
