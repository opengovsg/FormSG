import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useRef,
  useState,
} from 'react'
import { FormControl, Stack } from '@chakra-ui/react'

import {
  FormResponseMode,
  FormWorkflowSettings,
  MultirespondentFormSettings,
  WorkflowType,
} from '~shared/types'

import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { useMutateFormSettings } from '../../mutations'

interface WorkflowStepInputProps {
  workflowStep: number
  initialValue: FormWorkflowSettings
  handleMutation: (newWorkflow: FormWorkflowSettings) => void
}

const WorkflowStepInput = ({
  workflowStep,
  initialValue,
  handleMutation,
}: WorkflowStepInputProps): JSX.Element => {
  const initialEmail = initialValue[workflowStep].emails[0]
  const [value, setValue] = useState(initialEmail)
  const [workflow, setWorkflow] = useState(initialValue)

  const inputRef = useRef<HTMLInputElement>(null)

  const handleValueChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      setValue(e.target.value)
    },
    [],
  )
  const handleBlur = useCallback(() => {
    if (value === initialEmail) return
    const trimmedValue = value.trim()

    const newWorkflow = [...workflow]
    newWorkflow[workflowStep].emails = [trimmedValue]

    setWorkflow(newWorkflow)
    handleMutation(workflow)
    setValue(trimmedValue)
  }, [value, initialEmail, workflow, workflowStep, handleMutation])

  const handleKeydown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        inputRef.current?.blur()
      }
    },
    [],
  )

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={handleValueChange}
      onKeyDown={handleKeydown}
      onBlur={handleBlur}
    />
  )
}

export const WorkflowDetailsInput = ({
  settings,
}: {
  settings: MultirespondentFormSettings
}): JSX.Element => {
  const { mutateWorkflowSettings } = useMutateFormSettings()
  const handleWorkflowMutation = (newWorkflow: FormWorkflowSettings) => {
    mutateWorkflowSettings.mutate(newWorkflow)
  }

  const WORKFLOW_STEP_COUNT = 3
  const initialWorkflow =
    settings.workflow === undefined || settings.workflow.length === 0
      ? Array(WORKFLOW_STEP_COUNT).fill({
          emails: [],
          workflow_type: WorkflowType.Static,
        })
      : settings.workflow

  return settings?.responseMode === FormResponseMode.Multirespondent ? (
    <Stack spacing="2.5rem">
      <FormControl isRequired>
        <FormLabel description="This is the respondent that starts the workflow">
          First respondent
        </FormLabel>
        <WorkflowStepInput
          workflowStep={0}
          initialValue={initialWorkflow}
          handleMutation={handleWorkflowMutation}
        />
        {/* <FormErrorMessage>{errors.url?.message}</FormErrorMessage> */}
      </FormControl>
      <FormControl isRequired>
        <FormLabel description="Enter the email of the respondent that should fill in this form after the respondent above">
          Second respondent
        </FormLabel>
        <WorkflowStepInput
          workflowStep={1}
          initialValue={initialWorkflow}
          handleMutation={handleWorkflowMutation}
        />
        {/* <FormErrorMessage>{errors.url?.message}</FormErrorMessage> */}
      </FormControl>
      <FormControl isRequired>
        <FormLabel description="Enter the email of the respondent that should fill in this form after the respondent above">
          Third respondent
        </FormLabel>
        <WorkflowStepInput
          workflowStep={2}
          initialValue={initialWorkflow}
          handleMutation={handleWorkflowMutation}
        />
        {/* <FormErrorMessage>{errors.url?.message}</FormErrorMessage> */}
      </FormControl>
    </Stack>
  ) : (
    <></>
  )
}
