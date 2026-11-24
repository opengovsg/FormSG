import { ComponentProps } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Flex,
  FormControl,
  Stack,
  Text,
  usePrefersReducedMotion,
  VisuallyHidden,
} from '@chakra-ui/react'

import { FormWorkflowStep, UserDto, WorkflowType } from 'formsg-shared/types'

import { textStyles } from '~theme/textStyles'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Radio from '~components/Radio'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'

import { useAdminFormWorkflow } from '../../../../hooks/useAdminFormWorkflow'
import { useIsWorkflowEmailSourceInput } from '../../../../hooks/useIsWorkflowEmailSourceInput'
import { useWorkflowSurfaces } from '../../../../hooks/useWorkflowSurfaces'
import { stepToEmailSources } from '../../../../utils/stepRecipients'
import { useIsSpotlightActiveSection } from '../../../Spotlight'
import { StepRespondentBadges } from '../../InactiveStepBlock/StepRespondentBadges'
import { isFirstStepByStepNumber } from '../../utils/isFirstStepByStepNumber'
import { EditStepBlockContainer } from '../EditStepBlockContainer'

import { ConditionalRoutingOption } from './Components/ConditionalRoutingOption'
import { DynamicRespondentOption } from './Components/DynamicRespondentOption'
import { StaticRespondentOption } from './Components/StaticRespondentOption'
import { RecipientSummary } from './RecipientSummary'
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
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  useActionHeading?: boolean
  stepNumber: number
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
  user: UserDto | undefined
}

export const RespondentBlock = ({
  expanded,
  onExpandedChange,
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

  const prefersReducedMotion = usePrefersReducedMotion()
  const { cardHoverBg, iconTransitionDuration } = useWorkflowSurfaces()
  const collapsible = useActionHeading && !isFirstStep

  const content = (
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
          {collapsible ? (
            <VisuallyHidden as="label" htmlFor={RESPONDENT_SOURCE_INPUT_NAME}>
              {heading}
            </VisuallyHidden>
          ) : (
            <FormLabel style={textStyles.h4}>{heading}</FormLabel>
          )}
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
  if (!collapsible) return content

  const sources = stepToEmailSources(formMethods.getValues())
  const labels = [
    ...sources.emails,
    ...[...sources.emailFields, ...sources.dropdownFields].map((id) => {
      const field = idToFieldMap[id]
      return field
        ? `${field.questionNumber}. ${field.title}`
        : t('components.emailSourceInput.missingField')
    }),
  ]
  return (
    <Accordion
      reduceMotion={prefersReducedMotion}
      allowToggle
      index={expanded ? 0 : -1}
      onChange={(index) => onExpandedChange(index === 0)}
    >
      <AccordionItem border="0">
        <AccordionButton
          px={{ base: '1.5rem', md: '2rem' }}
          py="1.5rem"
          transitionProperty="background-color"
          transitionDuration={iconTransitionDuration}
          _hover={{ bg: cardHoverBg }}
          textAlign="left"
          gap="0.75rem"
          aria-label={heading}
          aria-describedby={
            expanded ? undefined : `recipient-summary-${stepNumber}`
          }
        >
          <Text
            minW="0"
            maxW={
              expanded
                ? '100%'
                : labels.length
                  ? 'calc(100% - 8rem)'
                  : 'calc(100% - 12rem)'
            }
            isTruncated
            style={textStyles.h4}
          >
            {heading}
          </Text>
          <Flex flex="1" minW="0" justify="flex-end">
            {!expanded && <RecipientSummary labels={labels} />}
          </Flex>
          {!expanded && (
            <VisuallyHidden id={`recipient-summary-${stepNumber}`}>
              {labels.join(', ') || 'No person selected'}
            </VisuallyHidden>
          )}
          <AccordionIcon flexShrink={0} />
        </AccordionButton>
        <AccordionPanel px="0" pt="0.25rem" pb="1.5rem">
          {content}
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}
