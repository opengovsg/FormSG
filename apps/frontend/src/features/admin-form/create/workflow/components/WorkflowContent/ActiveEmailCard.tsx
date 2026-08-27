import { useCallback, useEffect, useState } from 'react'
import { Controller, RegisterOptions, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { get, isEmpty, isEqual, uniq } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { MultirespondentFormSettings } from 'formsg-shared/types'

import { useOptionalAdminEmailValidationRules } from '~utils/formValidation'
import Button from '~components/Button'
import { MultiSelect, SingleSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import { TagInput } from '~components/TagInput'
import Toggle from '~components/Toggle'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { useMutateFormSettings } from '~features/admin-form/settings/mutations'
import { useAdminFormSettings } from '~features/admin-form/settings/queries'

import {
  completePendingSwitchSelector,
  pendingSwitchToSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'

import { EmailLabel } from './EmailLabel'

const WORKFLOW_EMAIL_MULTISELECT_NAME = 'email-multi-select'
const STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME =
  'step-1-notify-single-select'
const OTHER_PARTIES_EMAIL_INPUT_NAME = 'other-parties-email-input'

interface FormData {
  [WORKFLOW_EMAIL_MULTISELECT_NAME]: string[]
  [OTHER_PARTIES_EMAIL_INPUT_NAME]: string[]
  [STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]: string
}

interface ActiveEmailCardProps {
  onDone: () => void
}

export const ActiveEmailCard = ({
  onDone,
}: ActiveEmailCardProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    isLoading,
    formWorkflow,
    emailFormFields = [],
  } = useAdminFormWorkflow()

  const { data: settings } = useAdminFormSettings<MultirespondentFormSettings>()

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

  const stepsToNotify = settings?.stepsToNotify ?? []
  const emails = settings?.emails ?? []
  const stepOneEmailNotificationFieldId =
    settings?.stepOneEmailNotificationFieldId ?? ''

  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
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
    return handleSubmitEmailNotificationSettings({
      nextStepsToNotify: formData[WORKFLOW_EMAIL_MULTISELECT_NAME],
      nextStaticEmails: formData[OTHER_PARTIES_EMAIL_INPUT_NAME],
      nextStepOneEmailNotificationFieldId:
        formData[STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME],
    })
  }

  const handleSaveAndDone = () => {
    handleSubmit(onSubmit)()
    onDone()
  }

  // Auto-save when user clicks a step while email card is active
  const pendingSwitchTo = useAdminWorkflowStore(pendingSwitchToSelector)
  const completePendingSwitch = useAdminWorkflowStore(
    completePendingSwitchSelector,
  )

  useEffect(() => {
    if (pendingSwitchTo === null) return
    // Save and close, then complete the switch
    handleSubmit(onSubmit)()
    completePendingSwitch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSwitchTo])

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

  // Per-step guidance toggle
  const [guidedEdit, setGuidedEdit] = useState(false)
  const TOTAL_SECTIONS = 3
  const [guidedSection, setGuidedSection] = useState(1)

  // Reset section when toggling on
  const handleToggleGuide = () => {
    setGuidedEdit((v) => {
      if (!v) setGuidedSection(1)
      return !v
    })
  }

  const isSectionVisible = (sectionIndex: number) => {
    if (!guidedEdit) return true
    return sectionIndex <= guidedSection
  }

  const handleGuidedContinue = () => {
    setGuidedSection((s) => Math.min(s + 1, TOTAL_SECTIONS))
  }

  const GUIDED_HINTS: Record<number, string> = {
    1: 'Add email addresses for anyone outside the workflow, like your admin or supervisor.',
    2: 'Pick an email field from your form to notify the person who started it.',
    3: 'Notify people from other steps when the workflow is done.',
  }

  const handleGuidedBack = () => {
    setGuidedSection((s) => Math.max(1, s - 1))
  }

  const isLastGuidedSection = guidedSection >= TOTAL_SECTIONS

  const renderGuidedHint = (sectionIndex: number) => {
    if (!guidedEdit) return null
    if (sectionIndex !== guidedSection) return null
    return (
      <InlineMessage variant="info">{GUIDED_HINTS[sectionIndex]}</InlineMessage>
    )
  }

  return (
    <Stack
      py="2rem"
      spacing="1.5rem"
      borderRadius="8px"
      bg="primary.100"
      border="2px solid"
      borderColor="primary.500"
      transition="background-color 0.3s ease, border-color 0.3s ease"
    >
      {/* Header */}
      <Box px={{ base: '1.5rem', md: '2rem' }}>
        <EmailLabel />
      </Box>

      <Divider />

      <Stack spacing="1.5rem" px={{ base: '1.5rem', md: '2rem' }}>
        {/* Section 1: Any email address you choose (tag input) */}
        <FormControl
          isInvalid={!isEmpty(errors[OTHER_PARTIES_EMAIL_INPUT_NAME])}
        >
          <Text textStyle="subhead-2" mb="0.75rem" color="secondary.700">
            {t(
              'features.adminForm.settings.emailNotifications.section.mrf.respondents.others.label',
            )}{' '}
            <Text as="span" color="secondary.400" fontWeight="normal">
              (optional)
            </Text>
          </Text>
          <Controller<FormData>
            name={OTHER_PARTIES_EMAIL_INPUT_NAME}
            control={control}
            rules={
              optionalAdminEmailValidationRules as RegisterOptions<FormData>
            }
            render={({ field }) => (
              <TagInput
                placeholder={otherPartiesEmailInputPlaceholder}
                {...field}
                value={field.value as string[]}
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
        {renderGuidedHint(1)}

        {/* Section 2: An email address collected from an email field (dropdown) */}
        {isSectionVisible(2) && (
          <>
            <Box>
              <Text textStyle="subhead-2" mb="0.75rem" color="secondary.700">
                {t(
                  'features.adminForm.settings.emailNotifications.section.mrf.respondents.step1.label',
                )}{' '}
                <Text as="span" color="secondary.400" fontWeight="normal">
                  (optional)
                </Text>
              </Text>
              <Skeleton isLoaded={!isLoading}>
                <Controller
                  control={control}
                  name={STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME}
                  render={({ field: { value, onBlur, ...rest } }) => (
                    <SingleSelect
                      isDisabled={isLoading}
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
            {renderGuidedHint(2)}
          </>
        )}

        {/* Section 3: People who are filling up a workflow step (multi-select) */}
        {isSectionVisible(3) && (
          <>
            <Box>
              <Text textStyle="subhead-2" mb="0.75rem" color="secondary.700">
                {t(
                  'features.adminForm.settings.emailNotifications.section.mrf.respondents.stepN.label.overall',
                )}{' '}
                <Text as="span" color="secondary.400" fontWeight="normal">
                  (optional)
                </Text>
              </Text>
              <Skeleton isLoaded={!isLoading}>
                <Controller
                  control={control}
                  name={WORKFLOW_EMAIL_MULTISELECT_NAME}
                  render={({
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
                      placeholder={t(
                        'features.adminForm.settings.emailNotifications.section.mrf.respondents.stepN.placeholder',
                      )}
                      isSelectedItemFullWidth
                      isDisabled={isLoading}
                      {...rest}
                    />
                  )}
                />
              </Skeleton>
            </Box>
            {renderGuidedHint(3)}
          </>
        )}
      </Stack>

      {/* Footer */}
      <Divider />
      {guidedEdit && !isLastGuidedSection ? (
        <Flex
          px={{ base: '1.5rem', md: '2rem' }}
          justifyContent="flex-end"
          gap="0.75rem"
        >
          {guidedSection > 1 && (
            <Button variant="clear" onClick={handleGuidedBack}>
              Back
            </Button>
          )}
          <Button onClick={handleGuidedContinue}>Continue</Button>
        </Flex>
      ) : (
        <Box px={{ base: '1.5rem', md: '2rem' }}>
          <Flex justifyContent="flex-end" gap="0.75rem">
            {guidedEdit && guidedSection > 1 && (
              <Button variant="clear" onClick={handleGuidedBack}>
                Back
              </Button>
            )}
            <Button onClick={handleSaveAndDone}>Done</Button>
          </Flex>
        </Box>
      )}
    </Stack>
  )
}
