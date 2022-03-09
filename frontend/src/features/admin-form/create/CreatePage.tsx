import { Flex } from '@chakra-ui/react'

import {
  CreatePageSidebar,
  MobileCreatePageBottomBar,
} from './common/components/BuilderSidebar'
import { CreatePageContent } from './common/components/CreatePageContent'
import { CreatePageDrawerProvider } from './CreatePageDrawerContext'

export const CreatePage = (): JSX.Element => {
  return (
    <Flex
      h="100%"
      w="100%"
      overflow="auto"
      bg="neutral.200"
      direction={{ base: 'column', md: 'row' }}
    >
      <CreatePageDrawerProvider>
        <CreatePageSidebar />
        <CreatePageContent />
        <MobileCreatePageBottomBar />
      </CreatePageDrawerProvider>
    </Flex>
  )
}
