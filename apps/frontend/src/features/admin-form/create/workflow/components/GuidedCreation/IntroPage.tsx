import { Flex, Text } from '@chakra-ui/react'

import Button from '~components/Button'

import { useGuidedWorkflowStore } from '../../guidedWorkflowStore'
import { WorkflowSvgr } from '../WorkflowSvgr'

export const IntroPage = (): JSX.Element => {
  const startGuided = useGuidedWorkflowStore((state) => state.startGuided)

  return (
    <Flex
      textAlign="center"
      flexDir="column"
      align="center"
      color="secondary.500"
      pt={{ base: '0.5rem', md: '2.75rem' }}
    >
      <Text textStyle="h2" as="h2">
        Set up your workflow
      </Text>
      <Text textStyle="body-1" mt="1rem">
        A workflow passes your form between people. Each step has someone who
        fills in or reviews the form.
      </Text>
      <Button my="2.5rem" onClick={startGuided}>
        Let's start with Step 1
      </Button>
      <WorkflowSvgr maxW="292px" />
    </Flex>
  )
}
