import { useEffect, useState } from 'react'
import { Flex } from '@chakra-ui/react'

import { CreatePageContent } from './common/CreatePageContent'
import { CreatePageSidebar } from './common/CreatePageSidebar'
import { CreatePageSidebarProvider } from './common/CreatePageSidebarContext'
import { FeatureTour } from './featureTour/FeatureTour'

export const CreatePage = (): JSX.Element => {
  const [startFeatureTour, setStartFeatureTour] = useState(false)

  // TODO: need to add logic to only set startFeatureTour to be true if user
  // has not seen feature tour before
  useEffect(() => {
    setStartFeatureTour(true)
  }, [])

  return (
    <Flex h="100%" w="100%" overflow="auto" bg="neutral.200" direction="row">
      <CreatePageSidebarProvider>
        <FeatureTour shouldRun={startFeatureTour} />
        <CreatePageSidebar />
        <CreatePageContent />
      </CreatePageSidebarProvider>
    </Flex>
  )
}
