import { createContext, useContext } from 'react'

import type {
  applyIntervention,
  InterventionAction,
  InterventionDraft,
  PrototypeResponse,
} from './model'

export type Store = {
  responses: PrototypeResponse[]
  resetVersion: number
  reset: () => void
  dispatch: (
    responseId: string,
    action: InterventionAction,
    draft: InterventionDraft,
    expectedRevision: number,
    commandId: string,
  ) => ReturnType<typeof applyIntervention>
}
export const PrototypeContext = createContext<Store | null>(null)

export const usePrototypeStore = (): Store => {
  const context = useContext(PrototypeContext)
  if (!context) throw new Error('PrototypeProvider is missing')
  return context
}
export const useOptionalPrototypeStore = (): Store | null =>
  useContext(PrototypeContext)
