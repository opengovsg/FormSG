import { createContext, useContext } from 'react'

import { FCC } from '~typings/react'

import { useMeasure, UseMeasureRef } from '~hooks/useMeasure'

type CreatePageSidebarLayoutContextProps = {
  drawerRef: UseMeasureRef<HTMLDivElement>
  drawerWidth: number
}

const CreatePageSidebarLayoutContext = createContext<
  CreatePageSidebarLayoutContextProps | undefined
>(undefined)

export const useCreatePageSidebarLayout =
  (): CreatePageSidebarLayoutContextProps => {
    const context = useContext(CreatePageSidebarLayoutContext)
    if (!context) {
      throw new Error(
        `useCreatePageSidebarLayout must be used within a CreatePageSideBarLayoutProvider component`,
      )
    }
    return context
  }

export const useCreatePageSidebarLayoutContext =
  (): CreatePageSidebarLayoutContextProps => {
    const [drawerRef, { width: drawerWidth }] = useMeasure<HTMLDivElement>()
    return {
      drawerRef,
      drawerWidth,
    }
  }

export const CreatePageSideBarLayoutProvider: FCC = ({ children }) => {
  const context = useCreatePageSidebarLayoutContext()
  return (
    <CreatePageSidebarLayoutContext.Provider value={context}>
      {children}
    </CreatePageSidebarLayoutContext.Provider>
  )
}
