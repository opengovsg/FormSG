import { createContext, RefObject, useContext } from 'react'

export type RadioGroupContextProps = {
  othersRadioRef: RefObject<HTMLInputElement | null>
  othersInputRef: RefObject<HTMLInputElement | null>
}

export const RadioGroupContext = createContext<
  RadioGroupContextProps | undefined
>(undefined)

export const useRadioGroupWithOthers = (): RadioGroupContextProps => {
  const context = useContext(RadioGroupContext)
  if (!context) {
    throw new Error(
      `useRadioGroup must be used within a Radio.RadioGroup component`,
    )
  }
  return context
}
