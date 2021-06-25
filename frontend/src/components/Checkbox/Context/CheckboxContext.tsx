import React, { createContext, FC, useContext, useState } from 'react'

type CheckboxContextValues = {
  checkbox: string[]
  updateCheckbox: (value: string) => void
}

const defaultContextValues = {
  checkbox: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateCheckbox: (value: string) => {},
}

export const CheckboxContext =
  createContext<CheckboxContextValues | undefined>(undefined)

export const useCheckbox = () => {
  const value = useContext(CheckboxContext)

  if (!value) {
    throw new Error('useCheckbox must be called within a CheckboxProvider')
  }

  return value
}

const CheckboxProvider: FC = ({ children }) => {
  const [checkbox, setCheckbox] = useState<string[]>(
    defaultContextValues.checkbox,
  )
  const updateCheckbox = (option: string) => {
    console.log(option)
    if (checkbox.includes(option)) {
      setCheckbox(checkbox.filter((val) => val !== option))
    } else {
      setCheckbox([...checkbox, option])
    }
  }

  return (
    <CheckboxContext.Provider
      value={{
        checkbox,
        updateCheckbox,
      }}
    >
      {children}
    </CheckboxContext.Provider>
  )
}

export default CheckboxProvider
