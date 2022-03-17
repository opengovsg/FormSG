import { Flex } from '@chakra-ui/react'

import { CreatePageContent } from './common/CreatePageContent'
import {
  CreatePageSidebar,
  MobileCreatePageBottomBar,
} from './common/CreatePageSidebar'
import { CreatePageSidebarProvider } from './common/CreatePageSidebarContext'

export const CreatePage = (): JSX.Element => {
  return (
    <Flex h="100%" w="100%" overflow="auto" bg="neutral.200" direction="row">
      <CreatePageSidebarProvider>
        <CreatePageSidebar />
        <CreatePageContent />
        <MobileCreatePageBottomBar />
      </CreatePageSidebarProvider>
    </Flex>
  )
}
