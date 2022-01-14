import { Flex } from '@chakra-ui/react'

import { BuilderContent } from './BuilderContent'
import { BuilderDrawer } from './BuilderDrawer'
import { BuilderDrawerProvider } from './BuilderDrawerContext'
import { BuilderSidebar } from './BuilderSidebar'

export const FormBuilderPage = (): JSX.Element => {
  return (
    <Flex h="100%" w="100%" overflow="auto" bg="neutral.200" direction="row">
      <BuilderDrawerProvider>
        <BuilderSidebar />
        <BuilderDrawer />
      </BuilderDrawerProvider>
      <BuilderContent />
    </Flex>
  )
}
