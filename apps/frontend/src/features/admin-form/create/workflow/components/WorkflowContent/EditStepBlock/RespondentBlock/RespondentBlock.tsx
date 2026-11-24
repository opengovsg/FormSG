import { ComponentProps } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Flex, FormControl, Stack, Text } from '@chakra-ui/react'

import { FormWorkflowStep, UserDto, WorkflowType } from 'formsg-shared/types'

import { textStyles } from '~theme/textStyles'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Radio from '~components/Radio'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'

import { useAdminFormWorkflow } from '../../../../hooks/useAdminFormWorkflow'
import { useIsWorkflowEmailSourceInput } from '../../../../hooks/useIsWorkflowEmailSourceInput'
import { useIsSpotlightActiveSection } from '../../../Spotlight'
import { StepRespondentBadges } from '../../InactiveStepBlock/StepRespondentBadges'
import { isFirstStepByStepNumber } from '../../utils/isFirstStepByStepNumber'
import { EditStepBlockContainer } from '../EditStepBlockContainer'

import { ConditionalRoutingOption } from './Components/ConditionalRoutingOption'
import { DynamicRespondentOption } from './Components/DynamicRespondentOption'
import { StaticRespondentOption } from './Components/StaticRespondentOption'
import {
  RESPONDENT_SOURCE_INPUT_NAME,
  RespondentSourceInput,
} from './RespondentSourceInput'

const ReadOnlyHybridRespondents = (
  props: ComponentProps<typeof StepRespondentBadges>,
): JSX.Element => (
  <Flex gap="0.5rem" wrap="wrap">
    <StepRespondentBadges {...props} />
  </Flex>
)

interface RespondentBlockProps {
  useActionHeading?: boolean
  stepNumber: number
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
  user: UserDto | undefined
}

export const RespondentBlock = ({
  useActionHeading = false,
  stepNumber,
  isLoading,
  formMethods,
}: RespondentBlockProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    formState: { errors },
    watch,
  } = formMethods

  const {
    emailFormFields = [],
    dropdownFormFields = [],
    idToFieldMap = {},
  } = useAdminFormWorkflow()
  const isActiveSection = useIsSpotlightActiveSection()
  const isSourceInput = useIsWorkflowEmailSourceInput()

  const emailFieldItems = emailFormFields.map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )

  const selectedWorkflowType = watch('workflow_type')

  const isFirstStep = isFirstStepByStepNumber(stepNumber)
  const heading = t(
    useActionHeading
      ? 'features.adminForm.sidebar.workflow.respondentBlock.editorHeading'
      : isFirstStep
        ? 'features.adminForm.sidebar.workflow.respondentBlock.stepRespondent'
        : 'features.adminForm.sidebar.workflow.respondentBlock.select',
  )

  return (
    <EditStepBlockContainer>
      {isFirstStep ? (
        <Stack spacing="0.5rem">
          <Text style={textStyles.h4}>{heading}</Text>
          <Text>
            {t('features.adminForm.sidebar.workflow.respondentBlock.anyone')}
          </Text>
        </Stack>
      ) : (
        <FormControl
          id={isSourceInput ? RESPONDENT_SOURCE_INPUT_NAME : undefined}
          isReadOnly={isLoading}
          isRequired
          isInvalid={
            !!errors.workflow_type || (isSourceInput && !!errors.emails)
          }
        >
          <FormLabel style={textStyles.h4}>{heading}</FormLabel>
          {isActiveSection ? (
            <Text textStyle="body-2" color="secondary.400" mb="0.5rem">
              {t('features.adminForm.sidebar.workflow.guidedHints.respondent')}
            </Text>
          ) : null}
          {isSourceInput ? (
            <RespondentSourceInput
              formMethods={formMethods}
              isLoading={isLoading}
              emailFieldItems={emailFieldItems}
              dropdownFormFields={dropdownFormFields}
            />
          ) : selectedWorkflowType === WorkflowType.Hybrid ? (
            <ReadOnlyHybridRespondents
              step={formMethods.getValues() as FormWorkflowStep}
              idToFieldMap={idToFieldMap}
            />
          ) : (
            <>
              <Stack spacing="0.25rem">
                {/* Ordered by how often admins pick each one. */}
                <Radio.RadioGroup value={selectedWorkflowType}>
                  <StaticRespondentOption
                    selectedWorkflowType={selectedWorkflowType}
                    formMethods={formMethods}
                    isLoading={isLoading}
                  />
                  <DynamicRespondentOption
                    selectedWorkflowType={selectedWorkflowType}
                    emailFieldItems={emailFieldItems}
                    formMethods={formMethods}
                    isLoading={isLoading}
                  />
                  <ConditionalRoutingOption
                    selectedWorkflowType={selectedWorkflowType}
                    conditionalFormFields={dropdownFormFields}
                    formMethods={formMethods}
                    isLoading={isLoading}
                  />
                </Radio.RadioGroup>
              </Stack>
              <FormErrorMessage>
                {errors.workflow_type?.message}
              </FormErrorMessage>
            </>
          )}
        </FormControl>
      )}
    </EditStepBlockContainer>
  )
}
