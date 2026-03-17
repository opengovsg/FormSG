import { useContext } from 'react'

import {
  MagicFormBuilderContext,
  MagicFormBuilderProviderProps,
} from './MagicFormBuilderProvider'

export const useMagicFormBuilder = (): MagicFormBuilderProviderProps => {
  const context = useContext(MagicFormBuilderContext)
  if (!context) {
    throw new Error(
      `useMagicFormBuilder must be used within a MagicFormBuilderProvider component`,
    )
  }
  return context
}
