import { Divider, Flex } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'

const StepLine = () => (
  <Divider
    orientation="vertical"
    h="1rem"
    borderLeftWidth="2px"
    borderColor="secondary.200"
  />
)

/** The arrow between two workflow steps, in the builder and in Settings. */
export const WorkflowStepBlockDivider = ({ testId }: { testId?: string }) => (
  <Flex
    direction="column"
    align="center"
    alignSelf="center"
    aria-hidden="true"
    data-testid={testId}
  >
    <StepLine />
    <BxsChevronDown />
    <StepLine />
  </Flex>
)
