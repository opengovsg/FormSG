import { useEffect, useRef } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dictionary } from 'lodash'
import { Box, Stack, Text } from '@chakra-ui/react'
import { WorkflowType, FormField } from '~shared/types'

import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'
import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'
import {
  previewDataSelector,
  usePreviewWorkflowStore,
} from '../../../previewWorkflowStore'
import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { FormFieldWithQuestionNo } from '~features/form/types'
import { StepLabel } from '../StepLabel'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

interface CreatingStepBlockProps {
  stepNumber: number
}

interface RespondentBadgeProps {
  displayData: any
  idToFieldMap: Dictionary<FormFieldWithQuestionNo<FormField>>
}

const SubsequentStepRespondentBadges = ({
  displayData,
  idToFieldMap,
}: RespondentBadgeProps): JSX.Element => {
  const workflowType = displayData.workflow_type || WorkflowType.Static

  switch (workflowType) {
    case WorkflowType.Static:
      if (!displayData.emails || displayData.emails.length === 0) {
        return (
          <FieldLogicBadge
            defaults={{ variant: 'info', message: 'Unselected' }}
          />
        )
      }
      return (
        <>
          {displayData.emails.map((email: string) => (
            <LogicBadge key={email}>{email}</LogicBadge>
          ))}
        </>
      )
    case WorkflowType.Dynamic:
      if (!displayData.field) {
        return (
          <FieldLogicBadge
            defaults={{ variant: 'info', message: 'Unselected' }}
          />
        )
      }
      return <FieldLogicBadge field={idToFieldMap[displayData.field]} />
    case WorkflowType.Conditional:
      if (!displayData.conditional_field) {
        return (
          <FieldLogicBadge
            defaults={{ variant: 'info', message: 'Unselected' }}
          />
        )
      }
      return (
        <FieldLogicBadge field={idToFieldMap[displayData.conditional_field]} />
      )
    default:
      return (
        <FieldLogicBadge
          defaults={{ variant: 'info', message: 'Unselected' }}
        />
      )
  }
}

export const CreatingStepBlock = ({
  stepNumber,
}: CreatingStepBlockProps): JSX.Element => {
  const { t } = useTranslation()
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const isFirstStep = isFirstStepByStepNumber(stepNumber)
  const { idToFieldMap } = useAdminFormWorkflow()

  // Get preview data for creating step
  const previewData = usePreviewWorkflowStore(previewDataSelector(stepNumber))

  // Create display data with defaults
  const displayData = useMemo(() => {
    const defaults = {
      edit: [] as string[],
      workflow_type: WorkflowType.Static,
      emails: [] as string[],
      step_name: undefined as string | undefined,
      approval_field: undefined as string | undefined,
    }

    if (!previewData) return defaults

    return {
      ...defaults,
      ...previewData,
    }
  }, [previewData])

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
      <Box
        border="2px solid"
        borderColor="primary.500"
        bg="white"
        borderRadius="4px"
        p={{ base: '1.5rem', md: '2rem' }}
      >
        <Stack spacing="1.5rem">
          {/* Step Label */}
          <StepLabel stepNumber={stepNumber} stepName={displayData.step_name} />
          {/* Respondent Section */}
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
              <SubsequentStepRespondentBadges
                displayData={displayData}
                idToFieldMap={idToFieldMap}
              />
            )}
          </Stack>

          {/* Fields Section */}
          <Stack>
            <Text textStyle="subhead-3">
              {t(
                'features.adminForm.sidebar.workflow.respondentBlock.fieldsToFill',
              )}
            </Text>
            {!displayData.edit || displayData.edit.length === 0 ? (
              <FieldLogicBadge
                defaults={{ variant: 'info', message: 'Unselected' }}
              />
            ) : (
              <Stack direction="column" spacing="0.25rem">
                {displayData.edit.map((fieldId: string, index: number) => (
                  <FieldLogicBadge
                    key={index}
                    field={idToFieldMap[fieldId]}
                    defaults={{
                      variant: 'info',
                      message: 'This field was deleted',
                    }}
                  />
                ))}
              </Stack>
            )}
          </Stack>

          {/* Approvals Section (if not first step) */}
          {!isFirstStep && (
            <Stack>
              <Text textStyle="subhead-3">
                {t('features.adminForm.sidebar.workflow.approvals.title')}
              </Text>
              {!displayData.approval_field ? (
                <FieldLogicBadge
                  defaults={{
                    variant: 'info',
                    message: t(
                      'features.adminForm.sidebar.workflow.approvals.notRequired',
                    ),
                  }}
                />
              ) : (
                <FieldLogicBadge
                  field={idToFieldMap[displayData.approval_field]}
                  defaults={{
                    variant: 'info',
                    message: 'This field was deleted',
                  }}
                />
              )}
            </Stack>
          )}
        </Stack>
      </Box>
    </Box>
  )
}
