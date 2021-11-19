import { Flex } from '@chakra-ui/react'

import { BuilderDrawer } from './BuilderDrawer'
import { BuilderDrawerProvider } from './BuilderDrawerContext'
import { BuilderSidebar } from './BuilderSidebar'

export const FormBuilderPage = (): JSX.Element => {
  return (
    <BuilderDrawerProvider>
      <Flex h="100%" w="100%" overflow="auto" bg="neutral.200" direction="row">
        <BuilderSidebar />
        <BuilderDrawer />
        <Flex flex={1} bg="neutral.200">
          Builder content
        </Flex>
      </Flex>
    </BuilderDrawerProvider>
  )
}
