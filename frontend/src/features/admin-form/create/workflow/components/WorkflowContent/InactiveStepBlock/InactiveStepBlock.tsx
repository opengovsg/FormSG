import { useCallback, useMemo } from 'react'
import { BiPencil } from 'react-icons/bi'
import { Box, chakra, Flex, Stack, Text } from '@chakra-ui/react'
import { Dictionary } from 'lodash'

import { FormField } from '~shared/types'
import { FormWorkflowStepDto, WorkflowType } from '~shared/types/form'

import IconButton from '~components/IconButton'

import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'
import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'
import { FormFieldWithQuestionNo } from '~features/form/types'
import { useUser } from '~features/user/queries'

import {
  createOrEditDataSelector,
  setToEditingSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
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
  const { idToFieldMap } = useAdminFormWorkflow()
  const setToEditing = useAdminWorkflowStore(setToEditingSelector)
  const stateData = useAdminWorkflowStore(createOrEditDataSelector)

  const { user } = useUser()
  // TODO: (MRF-email-notif) Remove isTest check when MRF email notifications and approvals are both out of beta
  const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'

  // Prevent editing step if some other step is being edited.
  const isPreventEdit = useMemo(() => !!stateData, [stateData])

  const handleClick = useCallback(() => {
    if (isPreventEdit) {
      return
    }
    setToEditing(stepNumber)
  }, [isPreventEdit, stepNumber, setToEditing])

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
          message:
            'This field was deleted and has been removed from your workflow',
        }}
      />
    ))
  }, [idToFieldMap, step.edit])

  return (
    <Box pos="relative">
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
        cursor={isPreventEdit ? 'not-allowed' : 'auto'}
        disabled={isPreventEdit}
        aria-disabled={isPreventEdit}
      >
        <Stack spacing="1.5rem" p={{ base: '1.5rem', md: '2rem' }}>
          <StepLabel stepNumber={stepNumber} />

          <Stack>
            <Text textStyle="subhead-3">Respondent in this step</Text>
            {/* TODO: (MRF-email-notif) Remove isTest and betaFlag check when MRF email
            notifications is out of beta */}
            {isFirstStep ? (
              <Text>Anyone who has access to your form</Text>
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

          <Stack>
            <Text textStyle="subhead-3">Fields to fill</Text>
            <Stack direction="column" spacing="0.25rem">
              {questionBadges}
            </Stack>
          </Stack>
          {/* TODO: (MRF-email-notif) Remove isTest and betaFlag check when approvals is out of beta */}
          {isTest || user?.betaFlags?.mrfEmailNotifications ? (
            !isFirstStep ? (
              <InactiveApprovalsBlock step={step} idToFieldMap={idToFieldMap} />
            ) : null
          ) : null}
        </Stack>
      </chakra.button>
      {
        <IconButton
          top={{ base: '0.5rem', md: '2rem' }}
          right={{ base: '0.5rem', md: '2rem' }}
          pos="absolute"
          aria-label="Click to edit"
          variant="clear"
          onClick={handleClick}
          icon={<BiPencil fontSize="1.5rem" />}
          cursor={isPreventEdit ? 'not-allowed' : 'pointer'}
        />
      }
    </Box>
  )
}
