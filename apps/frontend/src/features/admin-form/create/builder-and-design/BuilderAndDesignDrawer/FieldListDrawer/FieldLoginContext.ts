import { createContext, useContext } from 'react'

import { FormAuthType } from 'formsg-shared/types'

export type RequestField = (
  provider: FormAuthType.MyInfo | FormAuthType.CP,
  add: () => void,
) => void
export const FieldLoginContext = createContext<RequestField | undefined>(
  undefined,
)
export const useFieldLoginGate = () => useContext(FieldLoginContext)
