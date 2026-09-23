import { Flex, TabList } from '@chakra-ui/react'

import { useDraggable } from '~hooks/useDraggable'
import { noPrintCss } from '~utils/noPrintCss'

import { RESULTS_NAV_WIDTH } from './constants'
import { ResultsTab } from './ResultsTab'
import { ResultsTabEntry } from './useResultsTabs'

export const FormResultsNavbar = ({
  tabs,
}: {
  tabs: ResultsTabEntry[]
}): JSX.Element => {
  const { ref, onMouseDown } = useDraggable<HTMLDivElement>()

  return (
    <Flex
      sx={noPrintCss}
      h="max-content"
      flex="1 1 0"
      ref={ref}
      onMouseDown={onMouseDown}
      position="sticky"
      zIndex={0}
      top={{ base: '2.5rem', lg: '3.125rem' }}
      borderTopColor="neutral.300"
      minW={RESULTS_NAV_WIDTH}
      __css={{
        scrollbarWidth: 0,
        '&::-webkit-scrollbar': {
          width: 0,
          height: 0,
        },
      }}
    >
      <TabList
        overflowX="initial"
        display="inline-flex"
        w={{ base: 'auto', lg: '13rem' }}
        mr={{ base: '1.5rem', md: '4rem', lg: '2rem' }}
        mb="calc(0.5rem - 2px)"
      >
        {tabs.map((tab) => (
          <ResultsTab
            key={tab.path}
            label={tab.label}
            icon={tab.icon}
            badgeText={tab.badgeText}
          />
        ))}
      </TabList>
    </Flex>
  )
}
