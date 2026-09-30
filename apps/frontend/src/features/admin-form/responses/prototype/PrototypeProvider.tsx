import { PropsWithChildren, useRef, useState } from 'react'

import { PrototypeContext, Store } from './context'
import { applyIntervention, createPrototypeResponses } from './model'

export const PrototypeProvider = ({
  children,
}: PropsWithChildren): JSX.Element => {
  const [responses, setResponses] = useState(createPrototypeResponses)
  const current = useRef(responses)
  const [resetVersion, setResetVersion] = useState(0)
  const reset = () => {
    current.current = createPrototypeResponses()
    setResponses(current.current)
    setResetVersion((value) => value + 1)
  }
  const dispatch: Store['dispatch'] = (
    responseId,
    action,
    draft,
    expectedRevision,
    commandId,
  ) => {
    const response = current.current.find((item) => item.id === responseId)
    if (!response)
      return { ok: false, message: 'This response is no longer available.' }
    const result = applyIntervention(response, {
      id: commandId,
      expectedRevision,
      action,
      draft,
      actor: 'admin@example.org',
      at: new Date().toISOString(),
    })
    if (result.ok) {
      current.current = current.current.map((item) =>
        item.id === responseId ? result.response : item,
      )
      setResponses(current.current)
    }
    return result
  }
  return (
    <PrototypeContext.Provider
      value={{ responses, resetVersion, reset, dispatch }}
    >
      {children}
    </PrototypeContext.Provider>
  )
}
