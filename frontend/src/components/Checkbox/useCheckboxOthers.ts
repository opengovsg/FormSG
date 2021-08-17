import { createContext, RefObject, useContext } from 'react'

export type CheckboxOthersContextProps = {
  checkboxRef: RefObject<HTMLInputElement>
  inputRef: RefObject<HTMLInputElement>
}

export const CheckboxOthersContext = createContext<
  CheckboxOthersContextProps | undefined
>(undefined)

export const useCheckboxOthers = (): CheckboxOthersContextProps => {
  const context = useContext(CheckboxOthersContext)
  if (!context) {
    throw new Error(
      `useCheckboxOthers must be used within a Checkbox.OthersWrapper component`,
    )
  }
  return context
}
