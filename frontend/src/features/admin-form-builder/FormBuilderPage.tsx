import { Flex } from '@chakra-ui/react'

import { BuilderSidebar } from './common/components/BuilderSidebar'
import { BuilderDrawerProvider } from './BuilderDrawerContext'
import BuilderDesign from './design'

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
