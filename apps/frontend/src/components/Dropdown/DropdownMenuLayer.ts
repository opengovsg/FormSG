import { createContext, useContext } from 'react'
import { BoxProps } from '@chakra-ui/react'

/**
 * Dropdown menus are portalled to <body>, so inside a Chakra modal they render
 * behind the modal overlay. Wrap a modal's body in this provider (with e.g.
 * "popover") to raise its dropdown menus above the modal. Opt-in, so menus
 * elsewhere keep their default stacking.
 */
const DropdownMenuLayerContext = createContext<BoxProps['zIndex']>(undefined)

export const DropdownMenuLayerProvider = DropdownMenuLayerContext.Provider

export const useDropdownMenuZIndex = () => useContext(DropdownMenuLayerContext)
