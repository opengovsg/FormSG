import { ReactNode } from 'react'
import {
  Control,
  Controller,
  RegisterOptions,
  useFormState,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, FormControl, FormErrorMessage, Skeleton } from '@chakra-ui/react'
import { get, isEmpty, noop } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { useOptionalAdminEmailValidationRules } from '~utils/formValidation'
import { MultiSelect, SingleSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { useAdminFormWorkflow } from '~features/admin-form/create/workflow/hooks/useAdminFormWorkflow'
import { useIsWorkflowBuilderRedesign } from '~features/admin-form/create/workflow/hooks/useIsWorkflowBuilderRedesign'

export const WORKFLOW_EMAIL_MULTISELECT_NAME = 'email-multi-select'
export const STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME =
  'step-1-notify-single-select'
export const OTHER_PARTIES_EMAIL_INPUT_NAME = 'other-parties-email-input'

export interface MrfEmailRecipientsFormData {
  [WORKFLOW_EMAIL_MULTISELECT_NAME]: string[]
  [OTHER_PARTIES_EMAIL_INPUT_NAME]: string[]
  [STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]: string
}

export interface MrfEmailRecipientControlProps {
  control: Control<MrfEmailRecipientsFormData>
  isDisabled: boolean
  isHighContrast: boolean
  otherPartiesPlaceholder?: string
  /** Settings dedupes then submits here; the card only dedupes. */
  onOtherPartiesBlur: () => void
  /** Settings submits here; the card passes nothing. */
  onSelectBlur?: () => void
}

export interface MrfEmailRecipientsFieldGroupProps extends MrfEmailRecipientControlProps {
  /** Sits above the first control, sharing its wrapper. */
  heading?: ReactNode
}

const OtherPartiesRecipientControl = ({
  control,
  isDisabled,
  isHighContrast,
  otherPartiesPlaceholder,
  onOtherPartiesBlur,
}: MrfEmailRecipientControlProps): JSX.Element => {
  const { t } = useTranslation()
  // Subscribed here rather than taken as a prop: RHF's formState is a Proxy that
  // only tracks what is read during render, so a consumer that forgot to read
  // errors would silently pass stale ones.
  const { errors } = useFormState({
    control,
    name: OTHER_PARTIES_EMAIL_INPUT_NAME,
  })
  const isRedesign = useIsWorkflowBuilderRedesign()
  const optionalAdminEmailValidationRules =
    useOptionalAdminEmailValidationRules()

  return (
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
      <Controller<MrfEmailRecipientsFormData>
        name={OTHER_PARTIES_EMAIL_INPUT_NAME}
        control={control}
        rules={
          optionalAdminEmailValidationRules as RegisterOptions<MrfEmailRecipientsFormData>
        }
        render={({ field }) => (
          <TagInput
            placeholder={isDisabled ? undefined : otherPartiesPlaceholder}
            {...field}
            value={field.value as string[]}
            isDisabled={isDisabled}
            onBlur={onOtherPartiesBlur}
            tagValidation={isEmail}
          />
        )}
      />
      {isEmpty(errors[OTHER_PARTIES_EMAIL_INPUT_NAME]) ? (
        <FormLabel.Description color="secondary.400" mt="0.5rem">
          {t(
            isRedesign
              ? 'features.adminForm.settings.emailNotifications.section.mrf.respondents.others.descriptionRedesign'
              : 'features.adminForm.settings.emailNotifications.section.mrf.respondents.others.description',
          )}
        </FormLabel.Description>
      ) : (
        <FormErrorMessage>
          {get(errors, `${OTHER_PARTIES_EMAIL_INPUT_NAME}.message`)}
        </FormErrorMessage>
      )}
    </FormControl>
  )
}

const StepOneRecipientControl = ({
  control,
  isDisabled,
  onSelectBlur,
}: MrfEmailRecipientControlProps): JSX.Element => {
  const { t } = useTranslation()
  const { isLoading, emailFormFields = [] } = useAdminFormWorkflow()

  const emailFieldItems = emailFormFields.map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )

  return (
    <>
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
              onBlur={onSelectBlur}
              isClearable
              value={value}
              {...rest}
            />
          )}
        />
      </Skeleton>
    </>
  )
}

const WorkflowStepsRecipientControl = ({
  control,
  isDisabled,
  onSelectBlur,
}: MrfEmailRecipientControlProps): JSX.Element => {
  const { t } = useTranslation()
  const { isLoading, formWorkflow } = useAdminFormWorkflow()
  const isRedesign = useIsWorkflowBuilderRedesign()

  const formWorkflowStepsWithStepNumber =
    formWorkflow?.map((step, index) => ({
      ...step,
      stepNumber: index + 1,
    })) ?? []

  return (
    <>
      <FormLabel mb="0.75rem" textColor="secondary.700">
        {t(
          isRedesign
            ? 'features.adminForm.settings.emailNotifications.section.mrf.respondents.stepN.label.overallRedesign'
            : 'features.adminForm.settings.emailNotifications.section.mrf.respondents.stepN.label.overall',
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
              onBlur={onSelectBlur ?? noop}
              placeholder={
                isDisabled
                  ? null
                  : t(
                      'features.adminForm.settings.emailNotifications.section.mrf.respondents.stepN.placeholder',
                    )
              }
              isSelectedItemFullWidth
              isDisabled={isLoading || isDisabled}
              maxItems={null}
              {...rest}
            />
          )}
        />
      </Skeleton>
    </>
  )
}

/**
 * The recipient controls that apply to this form, in order, each rendered
 * without spacing of its own so a caller can lay them out or spotlight them
 * one at a time.
 */
export const useMrfEmailRecipientControls = (
  props: MrfEmailRecipientControlProps,
): JSX.Element[] => {
  const { formWorkflow } = useAdminFormWorkflow()
  const workflowStepCount = formWorkflow?.length ?? 0

  return [
    <OtherPartiesRecipientControl key="others" {...props} />,
    ...(workflowStepCount >= 1
      ? [<StepOneRecipientControl key="step1" {...props} />]
      : []),
    ...(workflowStepCount >= 2
      ? [<WorkflowStepsRecipientControl key="stepN" {...props} />]
      : []),
  ]
}

/**
 * The MRF completion email recipient controls, without any form or mutation of
 * their own. Shared by Settings > Email notifications and the completion email
 * card on the workflow tab, so the two cannot drift.
 *
 * Save behaviour is injected rather than baked in: the two consumers commit at
 * different moments. Everything else, including which controls appear at which
 * workflow step count, is identical by construction.
 */
export const MrfEmailRecipientsFieldGroup = ({
  heading,
  ...controlProps
}: MrfEmailRecipientsFieldGroupProps): JSX.Element => {
  const [firstControl, ...remainingControls] =
    useMrfEmailRecipientControls(controlProps)

  return (
    <>
      <Box my="1.5rem">
        {heading}
        {firstControl}
      </Box>
      <Box>
        {remainingControls.map((control) => (
          <Box key={control.key} mb="1.5rem">
            {control}
          </Box>
        ))}
      </Box>
    </>
  )
}
