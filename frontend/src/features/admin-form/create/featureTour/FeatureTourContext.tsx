import { createContext, useContext } from 'react'

type FeatureTourContextProps = {
  paginationCallback: (indicatorIdx: number) => void
}

export const FeatureTourContext = createContext<
  FeatureTourContextProps | undefined
>(undefined)

export const useFeatureTour = () => {
  const context = useContext(FeatureTourContext)

  if (context === undefined) {
    throw new Error(
      `useSelectContext must be used within a SelectContextProvider`,
    )
  }

  return context
}
