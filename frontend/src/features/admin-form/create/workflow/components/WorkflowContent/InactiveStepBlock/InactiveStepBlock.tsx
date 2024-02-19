import { useCallback, useMemo } from 'react'
import { BiTrash } from 'react-icons/bi'
import { Box, chakra, Flex, Stack, Text } from '@chakra-ui/react'

import { FormWorkflowStepDto, WorkflowType } from '~shared/types/form'

import IconButton from '~components/IconButton'

import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'
import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'

import {
  createOrEditDataSelector,
  setToEditingSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { StepLabel } from '../StepLabel'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

interface InactiveStepBlockProps {
  stepNumber: number
  step: FormWorkflowStepDto
  handleOpenDeleteModal: () => void
}

export const InactiveStepBlock = ({
  stepNumber,
  step,
  handleOpenDeleteModal,
}: InactiveStepBlockProps): JSX.Element | null => {
  const { mapIdToField } = useAdminFormWorkflow()
  const setToEditing = useAdminWorkflowStore(setToEditingSelector)
  const stateData = useAdminWorkflowStore(createOrEditDataSelector)

  // Prevent editing step if some other step is being edited.
  const isPreventEdit = useMemo(() => !!stateData, [stateData])

  const handleClick = useCallback(() => {
    if (isPreventEdit) {
      return
    }
    setToEditing(stepNumber)
  }, [isPreventEdit, stepNumber, setToEditing])

  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  const respondentBadges = useMemo(() => {
    switch (step.workflow_type) {
      case WorkflowType.Static:
        return step.emails.map((email) => <LogicBadge>{email}</LogicBadge>)
      case WorkflowType.Dynamic:
        return <FieldLogicBadge field={mapIdToField[step.field]} />
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _: never = step
        throw new Error('Unexpected workflow type encountered')
      }
    }
  }, [mapIdToField, step])

  const questionBadges = useMemo(() => {
    const allInvalid = step.edit.every((fieldId) => !(fieldId in mapIdToField))

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
        field={mapIdToField[fieldId]}
        defaults={{
          variant: 'info',
          message:
            'This field was deleted and has been removed from your workflow',
        }}
      />
    ))
  }, [mapIdToField, step.edit])

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
        cursor={isPreventEdit ? 'not-allowed' : 'pointer'}
        disabled={isPreventEdit}
        aria-disabled={isPreventEdit}
        _hover={{
          _disabled: {
            bg: 'white',
          },
          bg: 'primary.100',
        }}
        _focus={{
          boxShadow: `0 0 0 4px var(--chakra-colors-primary-300)`,
        }}
        onClick={handleClick}
      >
        <Stack spacing="1.5rem" p={{ base: '1.5rem', md: '2rem' }}>
          <StepLabel stepNumber={stepNumber} />

          <Stack>
            <Text textStyle="subhead-3">Respondent in this step</Text>
            {isFirstStep ? (
              <Text>Anyone you share the form link with</Text>
            ) : (
              <Flex
                flexDir={{ base: 'column', md: 'row' }}
                gap={{ base: '0.5rem', md: '1rem' }}
                rowGap={{ md: '0.5rem' }}
                wrap="wrap"
              >
                {respondentBadges}
              </Flex>
            )}
          </Stack>

          <Stack>
            <Text textStyle="subhead-3">Questions to fill</Text>
            <Stack direction="column" spacing="0.25rem">
              {questionBadges}
            </Stack>
          </Stack>
        </Stack>
      </chakra.button>
      {!isFirstStep && (
        <IconButton
          top={{ base: '0.5rem', md: '2rem' }}
          right={{ base: '0.5rem', md: '2rem' }}
          pos="absolute"
          aria-label="Delete step"
          variant="clear"
          colorScheme="danger"
          onClick={handleOpenDeleteModal}
          icon={<BiTrash fontSize="1.5rem" />}
        />
      )}
    </Box>
  )
}
