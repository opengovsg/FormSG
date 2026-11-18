import { createContext, useContext } from 'react'
import { BoxProps } from '@chakra-ui/react'

const DropdownMenuLayerContext = createContext<BoxProps['zIndex']>(undefined)

export const DropdownMenuLayerProvider = DropdownMenuLayerContext.Provider

export const useDropdownMenuZIndex = () => useContext(DropdownMenuLayerContext)
