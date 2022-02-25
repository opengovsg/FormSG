import { Flex, TabList } from '@chakra-ui/react'

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
      <TabList
        ref={ref}
        onMouseDown={onMouseDown}
        w="100vw"
        borderBottom="none"
        justifyContent="flex-start"
        pt="1rem"
        px="1.5rem"
      >
        <Tab>Responses</Tab>
        <Tab>Feedback</Tab>
      </TabList>
    </Flex>
  )
}
