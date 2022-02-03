import { Flex } from '@chakra-ui/react'

import { BuilderContent } from './common/components/BuilderContent'
import { BuilderSidebar } from './common/components/BuilderSidebar'
import { BuilderDrawerProvider } from './BuilderDrawerContext'

export const FormBuilderPage = (): JSX.Element => {
  return (
    <Flex h="100%" w="100%" overflow="auto" bg="neutral.200" direction="row">
      <BuilderDrawerProvider>
        <BuilderSidebar />
        <BuilderContent />
      </BuilderDrawerProvider>
    </Flex>
  )
}
