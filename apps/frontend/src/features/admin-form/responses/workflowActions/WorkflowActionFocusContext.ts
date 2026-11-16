import { createContext } from 'react'

/** A shared owner restores focus after every action dialog finishes closing. */
export const WorkflowActionFocusContext = createContext<
  (() => void) | undefined
>(undefined)
