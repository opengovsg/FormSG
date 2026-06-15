import { BiCheck } from 'react-icons/bi'
import { Flex, Text } from '@chakra-ui/react'

import Button from '~components/Button'

import { useGuidedWorkflowStore } from '../../guidedWorkflowStore'

interface AddAnotherPromptProps {
  stepNumber: number
}

export const AddAnotherPrompt = ({
  stepNumber,
}: AddAnotherPromptProps): JSX.Element => {
  const addAnotherStep = useGuidedWorkflowStore((state) => state.addAnotherStep)
  const finishWorkflow = useGuidedWorkflowStore((state) => state.finishWorkflow)

  return (
    <Flex
      direction="column"
      align="center"
      gap="1.5rem"
      py="2rem"
      color="secondary.500"
    >
      <Flex align="center" gap="0.5rem">
        <BiCheck fontSize="1.5rem" color="var(--chakra-colors-success-500)" />
        <Text textStyle="body-1">Step {stepNumber + 1}&apos;s done.</Text>
      </Flex>
      <Text textStyle="body-1">Do you need another step?</Text>
      <Flex gap="0.75rem">
        <Button onClick={addAnotherStep}>Yes</Button>
        <Button
          variant="clear"
          colorScheme="secondary"
          onClick={finishWorkflow}
        >
          No
        </Button>
      </Flex>
    </Flex>
  )
}
