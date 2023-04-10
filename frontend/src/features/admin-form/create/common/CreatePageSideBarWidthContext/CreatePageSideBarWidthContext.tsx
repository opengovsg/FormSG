import { createContext, FC, useContext } from 'react'

import { useMeasure, UseMeasureRef } from '~hooks/useMeasure'

type CreatePageSidebarWidthContextProps = {
  drawerRef: UseMeasureRef<HTMLDivElement>
  drawerWidth: number
}

const CreatePageSidebarWidthContext = createContext<
  CreatePageSidebarWidthContextProps | undefined
>(undefined)

export const useCreatePageSidebarWidth =
  (): CreatePageSidebarWidthContextProps => {
    const context = useContext(CreatePageSidebarWidthContext)
    if (!context) {
      throw new Error(
        `useCreatePageSidebar must be used within a CreatePageSidebarWidthProvider component`,
      )
    }
    return context
  }

export const useCreatePageSidebarWidthContext =
  (): CreatePageSidebarWidthContextProps => {
    const [drawerRef, { width: drawerWidth }] = useMeasure<HTMLDivElement>()
    return {
      drawerRef,
      drawerWidth,
    }
  }

export const CreatePageSiderBarWidthProvider: FC = ({ children }) => {
  const context = useCreatePageSidebarWidthContext()
  return (
    <CreatePageSidebarWidthContext.Provider value={context}>
      {children}
    </CreatePageSidebarWidthContext.Provider>
  )
}
