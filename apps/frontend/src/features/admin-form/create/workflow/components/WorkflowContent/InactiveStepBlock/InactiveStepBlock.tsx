import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BiPencil } from 'react-icons/bi'
import { Box, chakra, Flex, Icon, Stack, Text } from '@chakra-ui/react'
import { Dictionary } from 'lodash'

import { BasicField, FormField } from 'formsg-shared/types'
import { FormWorkflowStepDto, WorkflowType } from 'formsg-shared/types/form'
import { checkIsOptionsMismatched } from 'formsg-shared/utils/options-recipients-map-validation'

import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'
import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'
import { FormFieldWithQuestionNo } from '~features/form/types'

import {
  createOrEditDataSelector,
  requestSwitchToSelector,
  setToEditingSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { useIsWorkflowBuilderRedesign } from '../../../hooks/useIsWorkflowBuilderRedesign'
import { StepLabel } from '../StepLabel'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { InactiveApprovalsBlock } from './InactiveApprovalsBlock'

interface InactiveStepBlockProps {
  stepNumber: number
  step: FormWorkflowStepDto
}

interface RespondentBadgeProps {
  step: FormWorkflowStepDto
  idToFieldMap: Dictionary<FormFieldWithQuestionNo<FormField>>
}

const SubsequentStepRespondentBadges = ({
  step,
  idToFieldMap,
}: RespondentBadgeProps): JSX.Element => {
  switch (step.workflow_type) {
    case WorkflowType.Static:
      return (
        <>
          {step.emails.map((email) => (
            <LogicBadge key={email}>{email}</LogicBadge>
          ))}
        </>
      )
    case WorkflowType.Dynamic:
      return <FieldLogicBadge field={idToFieldMap[step.field]} />
    case WorkflowType.Conditional: {
      const selectedConditionalField = idToFieldMap[step.conditional_field]
      if (
        !selectedConditionalField ||
        selectedConditionalField.fieldType !== BasicField.Dropdown
      ) {
        return <FieldLogicBadge field={selectedConditionalField} />
      }
      const selectedConditionalFieldOptions =
        selectedConditionalField.fieldOptions
      const optionsToRecipientsMapOptions = Object.keys(
        selectedConditionalField.optionsToRecipientsMap || {},
      )
      const isOptionsMismatched = checkIsOptionsMismatched(
        optionsToRecipientsMapOptions,
        selectedConditionalFieldOptions,
      )
      return (
        <Stack direction="column" spacing="0.5rem">
          <FieldLogicBadge
            field={
              step.conditional_field
                ? idToFieldMap[step.conditional_field]
                : undefined
            }
          />
          {isOptionsMismatched ? (
            <FieldLogicBadge
              defaults={{
                variant: 'error',
                message: 'Please update your CSV options and emails',
              }}
            />
          ) : null}
        </Stack>
      )
    }
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = step
      throw new Error('Unexpected workflow type encountered')
    }
  }
}

export const InactiveStepBlock = ({
  stepNumber,
  step,
}: InactiveStepBlockProps): JSX.Element | null => {
  const { t } = useTranslation()
  const isRedesign = useIsWorkflowBuilderRedesign()
  const { idToFieldMap } = useAdminFormWorkflow()
  const setToEditing = useAdminWorkflowStore(setToEditingSelector)
  const stateData = useAdminWorkflowStore(createOrEditDataSelector)
  const requestSwitchTo = useAdminWorkflowStore(requestSwitchToSelector)

  const handleClick = useCallback(() => {
    if (stateData) {
      // Another step is open: auto-save it and switch here.
      requestSwitchTo(stepNumber)
      return
    }
    setToEditing(stepNumber)
  }, [stateData, stepNumber, setToEditing, requestSwitchTo])

  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  const questionBadges = useMemo(() => {
    if (step.edit.length === 0) {
      return (
        <FieldLogicBadge
          defaults={{
            variant: 'info',
            message: 'No fields selected',
          }}
        />
      )
    }

    const allInvalid = step.edit.every((fieldId) => !(fieldId in idToFieldMap))

    if (allInvalid) {
      return (
        <FieldLogicBadge
          defaults={{
            variant: 'error',
            message:
              'All fields were deleted, please select at least one field',
          }}
        />
      )
    }

    return step.edit.map((fieldId, index) => (
      <FieldLogicBadge
        key={index}
        field={idToFieldMap[fieldId]}
        defaults={{
          variant: 'info',
          message: 'This field was deleted, please select another field',
        }}
      />
    ))
  }, [idToFieldMap, step.edit])

  // Mirrors EditStepBlock's ordering; only the sequence differs by flag.
  const fieldsSection = (
    <Stack>
      <Text textStyle="subhead-3">
        {t('features.adminForm.sidebar.workflow.respondentBlock.fieldsToFill')}
      </Text>
      <Stack direction="column" spacing="0.25rem">
        {questionBadges}
      </Stack>
    </Stack>
  )
  // A step without approval says nothing worth a heading, and the reorder puts
  // this at the top of the card where the noise is most costly. Steps whose
  // approval field was deleted still render, to keep showing the error.
  const hideEmptyApprovals = isRedesign && !step.approval_field
  const approvalsSection =
    isFirstStep || hideEmptyApprovals ? null : (
      <InactiveApprovalsBlock step={step} idToFieldMap={idToFieldMap} />
    )

  return (
    <Box pos="relative" role="group">
      <chakra.button
        type="button"
        w="100%"
        textAlign="start"
        borderRadius="4px"
        bg="white"
        border="1px solid"
        borderColor="neutral.300"
        transitionProperty="common"
        transitionDuration="normal"
        cursor="pointer"
        _groupHover={{ borderColor: 'primary.500', bg: 'primary.100' }}
        onClick={handleClick}
      >
        <Stack spacing="1.5rem" p={{ base: '1.5rem', md: '2rem' }}>
          <StepLabel stepNumber={stepNumber} stepName={step.step_name} />

          <Stack>
            <Text textStyle="subhead-3">
              {t(
                isRedesign
                  ? 'features.adminForm.sidebar.workflow.respondentBlock.stepRespondentRedesign'
                  : 'features.adminForm.sidebar.workflow.respondentBlock.stepRespondent',
              )}
            </Text>
            {isFirstStep ? (
              <Text>
                {t(
                  isRedesign
                    ? 'features.adminForm.sidebar.workflow.respondentBlock.anyoneRedesign'
                    : 'features.adminForm.sidebar.workflow.respondentBlock.anyone',
                )}
              </Text>
            ) : (
              <Flex
                flexDir={{ base: 'column', md: 'row' }}
                gap={{ base: '0.5rem', md: '1rem' }}
                rowGap={{ md: '0.5rem' }}
                wrap="wrap"
              >
                <SubsequentStepRespondentBadges
                  step={step}
                  idToFieldMap={idToFieldMap}
                />
              </Flex>
            )}
          </Stack>

          {isRedesign ? (
            <>
              {approvalsSection}
              {fieldsSection}
            </>
          ) : (
            <>
              {fieldsSection}
              {approvalsSection}
            </>
          )}
        </Stack>
      </chakra.button>
      {/* The whole card is the button, so the pencil is a visual affordance
      only: no click target, no tab stop, hidden from AT. It reacts to hover on
      the card via the wrapper's role="group". */}
      <Icon
        as={BiPencil}
        aria-hidden
        pointerEvents="none"
        top={{ base: '0.5rem', md: '2rem' }}
        right={{ base: '0.5rem', md: '2rem' }}
        pos="absolute"
        fontSize="1.5rem"
        color="neutral.500"
        transitionProperty="common"
        transitionDuration="normal"
        _groupHover={{ color: 'primary.500' }}
      />
    </Box>
  )
}
