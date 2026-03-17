import { createContext, useContext } from 'react'

type FeatureTourContextProps = {
  paginationCallback: (indicatorIdx: number) => void
}

export const FeatureTourContext = createContext<
  FeatureTourContextProps | undefined
>(undefined)

export const useFeatureTourContext = () => {
  const context = useContext(FeatureTourContext)

  if (context === undefined) {
    throw new Error(
      `useFeatureTourContext must be used within a FeatureTourContextProvider`,
    )
  }

  return context
}
