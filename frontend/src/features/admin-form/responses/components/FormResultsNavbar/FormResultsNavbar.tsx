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
      boxShadow={{ lg: '0 1px 1px var(--chakra-colors-neutral-300)' }}
      bg="white"
      zIndex="docked"
      flex={1}
    >
      <TabList
        ref={ref}
        onMouseDown={onMouseDown}
        px={{ base: '0.5rem', md: '0.75rem', lg: '1rem' }}
        w={{ base: '100vw', lg: 'initial' }}
        gridArea="tabs"
        borderBottom="none"
        justifyContent={{ base: 'flex-start', lg: 'center' }}
        alignSelf="center"
      >
        <Tab>Responses</Tab>
        <Tab>Feedback</Tab>
      </TabList>
    </Flex>
  )
}
