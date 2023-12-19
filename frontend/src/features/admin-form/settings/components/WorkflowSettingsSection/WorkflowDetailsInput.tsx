import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useRef,
  useState,
} from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FormControl, FormErrorMessage, Stack } from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import {
  FormResponseMode,
  FormWorkflowSettings,
  MultirespondentFormSettings,
  WorkflowType,
} from '~shared/types'

import { INVALID_EMAIL_ERROR } from '~constants/validation'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { useMutateFormSettings } from '../../mutations'

interface WorkflowStepInputProps {
  workflowStep: number
  initialValue: FormWorkflowSettings
  handleMutation: (newWorkflow: FormWorkflowSettings) => void
  disableInput?: boolean
  labelTitle: string
  description?: string
  placeholder?: string
}

const WorkflowStepInput = ({
  workflowStep,
  initialValue,
  handleMutation,
  disableInput = false,
  labelTitle,
  description = 'Enter the email of the respondent that should fill in this form after the respondent above',
  placeholder = 'Enter the email of the respondent that should fill in this form after the respondent above',
}: WorkflowStepInputProps): JSX.Element => {
  const initialEmail = initialValue[workflowStep].emails[0]
  const [value, setValue] = useState(initialEmail)
  const [workflow, setWorkflow] = useState(initialValue)
  const [error, setError] = useState(false)
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
    if (!value) setError(false)
    if (value && !isEmail(value)) {
      setError(true)
      return
    }

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
    <FormControl isInvalid={error} isRequired>
      <FormLabel description={description} placeholder={placeholder}>
        {labelTitle}
      </FormLabel>
      <Input
        type="email"
        ref={inputRef}
        value={value}
        onChange={handleValueChange}
        onKeyDown={handleKeydown}
        onBlur={handleBlur}
        disabled={disableInput}
      />
      {error && <FormErrorMessage>{INVALID_EMAIL_ERROR}</FormErrorMessage>}
    </FormControl>
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

  //TODO: Change this when we introduce dynamic routing
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
      <WorkflowStepInput
        workflowStep={0}
        initialValue={initialWorkflow}
        handleMutation={handleWorkflowMutation}
        disableInput
        labelTitle="First respondent"
        description="This is the respondent that starts the workflow"
        placeholder="Anyone with the form link"
      />
      <WorkflowStepInput
        workflowStep={1}
        initialValue={initialWorkflow}
        handleMutation={handleWorkflowMutation}
        labelTitle="Second respondent"
      />
      <WorkflowStepInput
        workflowStep={2}
        initialValue={initialWorkflow}
        handleMutation={handleWorkflowMutation}
        labelTitle="Third respondent"
      />
    </Stack>
  ) : (
    <></>
  )
}
