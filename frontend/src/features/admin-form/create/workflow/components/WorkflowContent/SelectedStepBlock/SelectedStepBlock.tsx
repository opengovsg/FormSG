import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { BiTrash } from 'react-icons/bi'
import {
  previewDataSelector,
  usePreviewWorkflowStore,
} from '../../../previewWorkflowStore'
import { Box, chakra, Flex, Stack, Text } from '@chakra-ui/react'
import { Dictionary } from 'lodash'

import { BasicField, FormField } from '~shared/types'
import { FormWorkflowStepDto, WorkflowType } from '~shared/types/form'
import { checkIsOptionsMismatched } from '~shared/utils/options-recipients-map-validation'

import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'
import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'
import { FormFieldWithQuestionNo } from '~features/form/types'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { StepLabel } from '../StepLabel'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { InactiveApprovalsBlock } from '../InactiveStepBlock/InactiveApprovalsBlock'

import { useWorkflowMutations } from '../../../mutations'

interface SelectedStepBlockProps {
  stepNumber: number
  step: FormWorkflowStepDto
  handleOpenDeleteModal?: () => void
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

export const SelectedStepBlock = ({
  stepNumber,
  step,
  handleOpenDeleteModal,
}: SelectedStepBlockProps): JSX.Element | null => {
  const { t } = useTranslation()
  const { idToFieldMap } = useAdminFormWorkflow()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const { deleteStepMutation } = useWorkflowMutations()

  const isFirstStep = isFirstStepByStepNumber(stepNumber)
  // Get preview data for this step
  const previewData = usePreviewWorkflowStore(previewDataSelector(stepNumber))

  // Merge preview with saved data (preview overrides saved)
  const displayData = useMemo(() => {
    if (!previewData) return step

    // Merge: preview overrides saved
    return {
      ...step,
      ...previewData,
    }
  }, [previewData, step])

  const questionBadges = useMemo(() => {
    if (!displayData.edit || displayData.edit.length === 0) {
      return (
        <FieldLogicBadge
          defaults={{
            variant: 'info',
            message: 'No fields selected',
          }}
        />
      )
    }

    const allInvalid = displayData.edit.every(
      (fieldId) => !(fieldId in idToFieldMap),
    )

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

    return displayData.edit.map((fieldId, index) => (
      <FieldLogicBadge
        key={index}
        field={idToFieldMap[fieldId]}
        defaults={{
          variant: 'info',
          message: 'This field was deleted, please select another field',
        }}
      />
    ))
  }, [idToFieldMap, displayData.edit])

  // Auto-scroll into view when component mounts
  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [])

  return (
    <Box pos="relative" ref={wrapperRef}>
      <chakra.div
        w="100%"
        textAlign="start"
        borderRadius="4px"
        bg="primary.50"
        border="2px solid"
        borderColor="primary.500"
        boxShadow="0 0 0 1px var(--chakra-colors-primary-500)"
        transitionProperty="common"
        transitionDuration="normal"
      >
        <Stack spacing="1.5rem" p={{ base: '1.5rem', md: '2rem' }}>
          <StepLabel stepNumber={stepNumber} stepName={displayData.step_name} />
          <Stack>
            <Text textStyle="subhead-3">
              {t(
                'features.adminForm.sidebar.workflow.respondentBlock.stepRespondent',
              )}
            </Text>
            {isFirstStep ? (
              <Text>
                {t(
                  'features.adminForm.sidebar.workflow.respondentBlock.anyone',
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
                  step={displayData as FormWorkflowStepDto}
                  idToFieldMap={idToFieldMap}
                />
              </Flex>
            )}
          </Stack>

          <Stack>
            <Text textStyle="subhead-3">
              {t(
                'features.adminForm.sidebar.workflow.respondentBlock.fieldsToFill',
              )}
            </Text>
            <Stack direction="column" spacing="0.25rem">
              {questionBadges}
            </Stack>
          </Stack>
          {!isFirstStep ? (
            <InactiveApprovalsBlock
              step={displayData as FormWorkflowStepDto}
              idToFieldMap={idToFieldMap}
            />
          ) : null}
        </Stack>
      </chakra.div>
      {!isFirstStep && handleOpenDeleteModal ? (
        <Tooltip label="Delete step">
          <IconButton
            top={{ base: '0.5rem', md: '2rem' }}
            right={{ base: '0.5rem', md: '2rem' }}
            pos="absolute"
            aria-label="Delete step"
            variant="clear"
            colorScheme="danger"
            onClick={handleOpenDeleteModal}
            icon={<BiTrash fontSize="1.5rem" />}
            isDisabled={deleteStepMutation.isLoading}
          />
        </Tooltip>
      ) : null}
    </Box>
  )
}
