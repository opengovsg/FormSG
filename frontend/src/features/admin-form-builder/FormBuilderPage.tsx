import { Flex } from '@chakra-ui/react'

import { BuilderDrawerProvider } from './BuilderDrawerContext'
import { BuilderSidebar } from './BuilderSidebar'

export const FormBuilderPage = (): JSX.Element => {
  return (
    <BuilderDrawerProvider>
      <Flex h="100%" w="100%" overflow="auto" bg="neutral.200" direction="row">
        <BuilderSidebar />
        <Flex flex={1} bg="white">
          Builder content
        </Flex>
      </Flex>
    </BuilderDrawerProvider>
  )
}
