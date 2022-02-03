import { Flex } from '@chakra-ui/react'

import BuilderDesign from './components/BuilderDesign'
import { BuilderSidebar } from './components/BuilderSidebar'
import { BuilderDrawerProvider } from './BuilderDrawerContext'

export const FormBuilderPage = (): JSX.Element => {
  return (
    <Flex h="100%" w="100%" overflow="auto" bg="neutral.200" direction="row">
      <BuilderDrawerProvider>
        <BuilderSidebar />
        <BuilderDesign />
      </BuilderDrawerProvider>
    </Flex>
  )
}
