import { createContext, useContext } from 'react'
import { UseDisclosureReturn } from '@chakra-ui/react'

type BuilderAndDesignContextProps = {
  deleteFieldModalDisclosure: UseDisclosureReturn
}

export const BuilderAndDesignContext = createContext<
  BuilderAndDesignContextProps | undefined
>(undefined)

export const useBuilderAndDesignContext = () => {
  const context = useContext(BuilderAndDesignContext)
  if (!context) {
    throw new Error(
      'useBuilderAndDesignContext must be used within a BuilderAndDesignContextProvider',
    )
  }

  return context
}
