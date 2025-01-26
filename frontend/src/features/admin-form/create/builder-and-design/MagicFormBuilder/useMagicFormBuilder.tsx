import { useContext } from 'react'

import {
  MagicFormBuilderContext,
  MagicFormBuilderProviderProps,
} from './MagicFormBuilderProvider'

export const useMagicFormBuilder = (): MagicFormBuilderProviderProps => {
  const context = useContext(MagicFormBuilderContext)
  if (!context) {
    throw new Error(
      `useUnlockedResponsesContext must be used within a UnlockedResponsesProvider component`,
    )
  }
  return context
}
