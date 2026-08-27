import { useCallback, useLayoutEffect, useRef } from 'react'
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
import { get, isEmpty, uniq } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { MultirespondentFormSettings } from 'formsg-shared/types'

import { useOptionalAdminEmailValidationRules } from '~utils/formValidation'
import Button from '~components/Button'
import { MultiSelect, SingleSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { useMutateFormSettings } from '~features/admin-form/settings/mutations'
import { useAdminFormSettings } from '~features/admin-form/settings/queries'

import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { Spotlight } from '../Spotlight'
import { EmailLabel } from '../WorkflowContent/EmailLabel'

const WORKFLOW_EMAIL_MULTISELECT_NAME = 'email-multi-select'
const STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME =
  'step-1-notify-single-select'
const OTHER_PARTIES_EMAIL_INPUT_NAME = 'other-parties-email-input'

interface FormData {
  [WORKFLOW_EMAIL_MULTISELECT_NAME]: string[]
  [OTHER_PARTIES_EMAIL_INPUT_NAME]: string[]
  [STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]: string
}

interface GuidedEmailCardProps {
  onDone: () => void
}

export const GuidedEmailCard = ({
  onDone,
}: GuidedEmailCardProps): JSX.Element => {
  const { t } = useTranslation()
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [])

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

  const handleSaveAndDone = () => {
    handleSubmit((formData: FormData) => {
      mutateMrfEmailNotifications.mutate({
        emails: formData[OTHER_PARTIES_EMAIL_INPUT_NAME],
        stepsToNotify: formData[WORKFLOW_EMAIL_MULTISELECT_NAME],
        stepOneEmailNotificationFieldId:
          formData[STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME],
      })
    })()
    onDone()
  }

  const handleOtherPartiesEmailInputBlur = () => {
    const uniqueValidEmails = uniq(
      filterInvalidEmails(getValues(OTHER_PARTIES_EMAIL_INPUT_NAME)),
    )
    setValue(OTHER_PARTIES_EMAIL_INPUT_NAME, uniqueValidEmails)
  }

  const otherPartiesEmailInputPlaceholder =
    getValues(OTHER_PARTIES_EMAIL_INPUT_NAME)?.length > 0
      ? undefined
      : 'me@example.com'

  const optionalAdminEmailValidationRules =
    useOptionalAdminEmailValidationRules()

  return (
    <Stack
      ref={wrapperRef}
      py="2rem"
      spacing="1.5rem"
      borderRadius="8px"
      bg="white"
      border="1px solid"
      borderColor="neutral.300"
      transitionProperty="common"
      transitionDuration="normal"
    >
      <Box px={{ base: '1.5rem', md: '2rem' }}>
        <EmailLabel />
      </Box>

      <Divider />

      <Spotlight isActive>
        <Stack spacing="1.5rem" px={{ base: '1.5rem', md: '2rem' }}>
          <Text textStyle="body-2" color="secondary.400">
            Choose who gets notified when the workflow is done. You can always
            change this later.
          </Text>

          {/* 1st: Any email address you choose (tag input) */}
          <FormControl
            isInvalid={!isEmpty(errors[OTHER_PARTIES_EMAIL_INPUT_NAME])}
          >
            <FormLabel textColor="secondary.700" mb="0.75rem">
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

          {/* 2nd: An email address collected from an email field (dropdown) */}
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
          </Box>

          {/* 3rd: People who are filling up a workflow step (multi-select) */}
          <Box>
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
          </Box>
        </Stack>
      </Spotlight>

      <Divider />

      <Box px={{ base: '1.5rem', md: '2rem' }}>
        <Flex justifyContent="flex-end">
          <Button onClick={handleSaveAndDone}>Done</Button>
        </Flex>
      </Box>
    </Stack>
  )
}
