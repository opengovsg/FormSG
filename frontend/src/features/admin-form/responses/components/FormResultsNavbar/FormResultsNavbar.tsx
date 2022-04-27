import { Container, Flex, TabList } from '@chakra-ui/react'

import { useDraggable } from '~hooks/useDraggable'
import { Tab } from '~components/Tabs'

export const FormResultsNavbar = (): JSX.Element => {
  const { ref, onMouseDown } = useDraggable<HTMLDivElement>()
  return (
    <Flex
      w="100vw"
      position="sticky"
      top={0}
      flexDir="column"
      boxShadow="0 1px 1px var(--chakra-colors-neutral-300)"
      bg="white"
      zIndex="docked"
      flex={1}
    >
      <Container maxW="69.5rem" px="1.25rem" pt="0.625rem">
        <TabList
          ref={ref}
          onMouseDown={onMouseDown}
          w="100vw"
          borderBottom="none"
          justifyContent="flex-start"
        >
          <Tab>Responses</Tab>
          <Tab>Feedback</Tab>
        </TabList>
      </Container>
    </Flex>
  )
}
