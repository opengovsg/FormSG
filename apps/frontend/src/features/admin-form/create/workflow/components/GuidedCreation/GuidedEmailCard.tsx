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
} from '@chakra-ui/react'
import { get, isEmpty, uniq } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { MultirespondentFormSettings } from 'formsg-shared/types'

import { useOptionalAdminEmailValidationRules } from '~utils/formValidation'
import Button from '~components/Button'
import { MultiSelect, SingleSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import { TagInput } from '~components/TagInput'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { useMutateFormSettings } from '~features/admin-form/settings/mutations'
import { useAdminFormSettings } from '~features/admin-form/settings/queries'

import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { EmailLabel } from '../WorkflowContent/EmailLabel'

const TOTAL_SUB_STEPS = 5

const SUB_STEP_INFOBOXES = [
  // Sub-step 1: Just the label
  "When your workflow is complete, you can notify the people involved. Let's set that up.",
  // Sub-step 2: Person in Step 1 field
  'This notifies the person who started the form. Pick the email field they filled in so we know where to send it.',
  // Sub-step 3: Other people field
  'You can also notify people from other steps. Pick which steps should get a notification.',
  // Sub-step 4: Others field
  'Anyone else? Add email addresses for people outside the workflow, like your admin or supervisor.',
  // Sub-step 5: All enabled
  'Pick who gets notified when the workflow is done. You can also come back to this later.',
]

const WORKFLOW_EMAIL_MULTISELECT_NAME = 'email-multi-select'
const STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME =
  'step-1-notify-single-select'
const OTHER_PARTIES_EMAIL_INPUT_NAME = 'other-parties-email-input'

interface FormData {
  [WORKFLOW_EMAIL_MULTISELECT_NAME]: string[]
  [OTHER_PARTIES_EMAIL_INPUT_NAME]: string[]
  [STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]: string
}

const FadeIn = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Box
      opacity={isVisible ? 1 : 0}
      transform={isVisible ? 'translateY(0)' : 'translateY(8px)'}
      transition="opacity 0.3s ease, transform 0.3s ease"
    >
      {children}
    </Box>
  )
}

interface GuidedEmailCardProps {
  onDone: () => void
}

export const GuidedEmailCard = ({
  onDone,
}: GuidedEmailCardProps): JSX.Element => {
  const { t } = useTranslation()
  const [subStep, setSubStep] = useState(1)

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

  const handleSave = handleSubmit((formData: FormData) => {
    mutateMrfEmailNotifications.mutate({
      emails: formData[OTHER_PARTIES_EMAIL_INPUT_NAME],
      stepsToNotify: formData[WORKFLOW_EMAIL_MULTISELECT_NAME],
      stepOneEmailNotificationFieldId:
        formData[STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME],
    })
  })

  const handleOtherPartiesEmailInputBlur = () => {
    const uniqueValidEmails = uniq(
      filterInvalidEmails(getValues(OTHER_PARTIES_EMAIL_INPUT_NAME)),
    )
    setValue(OTHER_PARTIES_EMAIL_INPUT_NAME, uniqueValidEmails)
  }

  const allRevealed = subStep >= TOTAL_SUB_STEPS

  const handleContinue = () => {
    if (subStep < TOTAL_SUB_STEPS) {
      setSubStep((s) => s + 1)
    } else {
      handleSave()
      onDone()
    }
  }

  const handleBack = () => {
    if (subStep > 1) {
      setSubStep((s) => s - 1)
    }
  }

  const otherPartiesEmailInputPlaceholder =
    getValues(OTHER_PARTIES_EMAIL_INPUT_NAME)?.length > 0
      ? undefined
      : 'me@example.com'

  const optionalAdminEmailValidationRules =
    useOptionalAdminEmailValidationRules()

  return (
    <Stack
      py="2rem"
      spacing="1.5rem"
      borderRadius="4px"
      bg="white"
      border="1px solid"
      borderColor="primary.500"
      boxShadow="0 0 0 1px var(--chakra-colors-primary-500)"
      transitionProperty="common"
      transitionDuration="normal"
    >
      <Box px={{ base: '1.5rem', md: '2rem' }}>
        <EmailLabel />
      </Box>

      {subStep >= 2 && (
        <>
          <Divider />
          <Stack spacing="1.5rem" px={{ base: '1.5rem', md: '2rem' }}>
            {/* Sub-step 2: Person in Step 1 */}
            <FadeIn key="step1-field">
              <FormLabel mb="0.75rem" textColor="secondary.700">
                {t(
                  'features.adminForm.settings.emailNotifications.section.mrf.respondents.step1.label',
                )}
              </FormLabel>
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
                      isClearable
                      value={value}
                      {...rest}
                    />
                  )}
                />
              </Skeleton>
            </FadeIn>

            {/* Sub-step 3: Other people */}
            {subStep >= 3 && (
              <FadeIn key="stepN-field">
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
                        onBlur={onBlur}
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
              </FadeIn>
            )}

            {/* Sub-step 4: Others */}
            {subStep >= 4 && (
              <FadeIn key="others-field">
                <FormControl
                  isInvalid={!isEmpty(errors[OTHER_PARTIES_EMAIL_INPUT_NAME])}
                >
                  <FormLabel
                    textColor="secondary.700"
                    mb="0.75rem"
                    tooltipVariant="info"
                    tooltipPlacement="top"
                    tooltipText={t(
                      'features.adminForm.settings.emailNotifications.section.mrf.respondents.others.tooltipText',
                    )}
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
              </FadeIn>
            )}
          </Stack>
        </>
      )}

      <Box px={{ base: '1.5rem', md: '2rem' }}>
        <InlineMessage variant="info">
          {SUB_STEP_INFOBOXES[subStep - 1]}
        </InlineMessage>
      </Box>

      <Divider />

      <Box px={{ base: '1.5rem', md: '2rem' }}>
        <Flex justifyContent="flex-end" gap="0.75rem">
          {subStep > 1 && (
            <Button variant="clear" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button onClick={handleContinue}>
            {allRevealed ? 'Done' : 'Continue'}
          </Button>
        </Flex>
      </Box>
    </Stack>
  )
}
