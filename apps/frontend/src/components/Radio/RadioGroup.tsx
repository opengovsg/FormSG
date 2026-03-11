import { useRef } from 'react'
import {
  RadioGroup as ChakraRadioGroup,
  RadioGroupProps as ChakraRadioGroupProps,
} from '@chakra-ui/react'

import { RadioGroupContext } from './useRadioGroupWithOthers'

/**
 * Container for a group of radio buttons.
 */
export const RadioGroup = ({
  onChange,
  children,
  ...props
}: ChakraRadioGroupProps): JSX.Element => {
  const othersRadioRef = useRef<HTMLInputElement>(null)
  const othersInputRef = useRef<HTMLInputElement>(null)

  return (
    <RadioGroupContext.Provider
      value={{
        othersRadioRef,
        othersInputRef,
      }}
    >
      <ChakraRadioGroup {...props} onChange={onChange}>
        {children}
      </ChakraRadioGroup>
    </RadioGroupContext.Provider>
  )
}
