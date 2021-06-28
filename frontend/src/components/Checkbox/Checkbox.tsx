import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from 'react'
import {
  Checkbox as ChakraCheckbox,
  CheckboxProps,
  forwardRef,
  Input,
  InputProps as ChakraInputProps,
  Text,
  useCheckboxGroupContext,
  useControllableProp,
  useControllableState,
} from '@chakra-ui/react'

interface CheckboxContextProps {
  isChecked?: boolean
  isDisabled?: boolean
  setIsChecked: Dispatch<SetStateAction<boolean>>
}

const CheckboxContext =
  createContext<CheckboxContextProps | undefined>(undefined)

const useCheckboxState = (): CheckboxContextProps => {
  const value = useContext(CheckboxContext)
  if (!value) {
    throw new Error('useCheckboxState must be called within a Checkbox')
  }
  return value
}
export const Checkbox = forwardRef<Omit<CheckboxProps, 'ref'>, 'input'>(
  (
    {
      children,
      isChecked: isCheckedProp,
      value,
      isDisabled: isDisabledProp,
      ...props
    },
    ref,
  ) => {
    const group = useCheckboxGroupContext()
    let isActuallyChecked = isCheckedProp
    if (group?.value && value) {
      isActuallyChecked = group.value.includes(value)
    }

    const [isCheckControlled, checkedValue] = useControllableProp(
      isCheckedProp,
      isActuallyChecked,
    )

    const controlProps = isCheckControlled
      ? { value: checkedValue }
      : { defaultValue: checkedValue }

    const [isChecked, setIsChecked] = useControllableState({
      ...controlProps,
    })

    const [, isDisabled] = useControllableProp(
      isDisabledProp,
      group?.isDisabled,
    )

    return (
      // give children access to checkbox props and state then let them toggle it
      <CheckboxContext.Provider value={{ isChecked, setIsChecked, isDisabled }}>
        <ChakraCheckbox
          {...props}
          ref={ref}
          isChecked={isChecked}
          onChange={() => setIsChecked((prev) => !prev)}
        >
          {value}
        </ChakraCheckbox>
        <Text>{String(isChecked)}</Text>
        {children}
      </CheckboxContext.Provider>
    )
  },
)

export const CheckboxInput = forwardRef<ChakraInputProps, 'input'>(
  ({ onFocus, ...props }, ref) => {
    const { setIsChecked, isDisabled } = useCheckboxState()

    return (
      <Input
        {...props}
        isDisabled={isDisabled}
        ref={ref}
        onFocus={(e) => {
          if (onFocus) {
            onFocus(e)
          }
          setIsChecked(!!e.target.value)
        }}
      />
    )
  },
)

// Provides context for wrapping base checkboxes
export const CheckboxWrapper = ({
  children,
}: {
  children: ReactNode
}): JSX.Element => {
  const [isChecked, setIsChecked] = useState(false)

  return (
    // give children access to checkbox props and state then let them toggle it
    <CheckboxContext.Provider value={{ isChecked, setIsChecked }}>
      <Text>{String(isChecked)}</Text>
      {children}
    </CheckboxContext.Provider>
  )
}

// Wrapper over Chakra's base Checkbox
export const ComposableCheckbox = forwardRef(
  ({ isChecked: isCheckedProp, value, ...props }, ref): JSX.Element => {
    const { isChecked, setIsChecked } = useCheckboxState()

    return (
      // give children access to checkbox props and state then let them toggle it
      <ChakraCheckbox
        {...props}
        ref={ref}
        isChecked={isChecked}
        onChange={() => setIsChecked((prev) => !prev)}
      >
        {value}
      </ChakraCheckbox>
    )
  },
)
