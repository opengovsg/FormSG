import { Box, Flex, Stack, Text } from '@chakra-ui/react'

import Button from '~components/Button'

import { useGuidedWorkflowStore } from '../../guidedWorkflowStore'

interface AddAnotherPromptProps {
  stepNumber: number
}

export const AddAnotherPrompt = ({
  stepNumber,
}: AddAnotherPromptProps): JSX.Element => {
  const addAnotherStep = useGuidedWorkflowStore((state) => state.addAnotherStep)
  const startEmailSetup = useGuidedWorkflowStore(
    (state) => state.startEmailSetup,
  )

  return (
    <Box
      bg="primary.100"
      borderTopRadius="0"
      borderBottomRadius="8px"
      border="1px solid"
      borderColor="primary.200"
      mt="-0.5rem"
      py="1.5rem"
      px={{ base: '1.5rem', md: '2rem' }}
    >
      <Stack spacing="1rem">
        <Stack spacing="0.25rem">
          <Text textStyle="subhead-1" color="secondary.500">
            Nice, Step {stepNumber + 1} is all set
          </Text>
          <Text textStyle="body-2" color="secondary.400">
            Would you like to add another step?
          </Text>
        </Stack>
        <Flex justify="flex-end" gap="0.75rem">
          <Button
            variant="clear"
            colorScheme="secondary"
            onClick={startEmailSetup}
          >
            No, I'm done
          </Button>
          <Button onClick={addAnotherStep}>Yes, add a step</Button>
        </Flex>
      </Stack>
    </Box>
  )
}
