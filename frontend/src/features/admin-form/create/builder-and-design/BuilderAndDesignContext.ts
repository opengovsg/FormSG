import { createContext, RefObject, useContext } from 'react'
import { UseDisclosureReturn } from '@chakra-ui/react'

export type BuilderAndDesignContextProps = {
  deleteFieldModalDisclosure: UseDisclosureReturn
  paymentPreviewRef: RefObject<HTMLDivElement>
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
