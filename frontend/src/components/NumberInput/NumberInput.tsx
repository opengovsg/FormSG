import { BiCaretDown, BiCaretUp } from 'react-icons/bi'
import {
  forwardRef,
  Icon,
  InputRightElement,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput as ChakraNumberInput,
  NumberInputField,
  NumberInputProps as ChakraNumberInputProps,
  NumberInputStepper,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { omit } from '@chakra-ui/utils'

import { BxsCheckCircle } from '~assets/icons/BxsCheckCircle'

export interface NumberInputProps extends ChakraNumberInputProps {
  /**
   * Whether the input is in a prefilled state.
   */
  isPrefilled?: boolean
  /**
   * Whether the input is in a success state.
   */
  isSuccess?: boolean
}

export const NumberInput = forwardRef<NumberInputProps, 'input'>(
  (props, ref) => {
    const { isSuccess } = props
    const inputStyles = useMultiStyleConfig('NumberInput', props)
    // Omit extra props so they will not be passed into the DOM and trigger
    // React warnings.
    const inputProps = omit(props, ['isSuccess', 'isPrefilled'])

    return (
      <ChakraNumberInput {...inputProps} ref={ref}>
        <NumberInputField sx={inputStyles.field} />
        {isSuccess && (
          <InputRightElement sx={inputStyles.success}>
            <Icon as={BxsCheckCircle} />
          </InputRightElement>
        )}
        <NumberInputStepper>
          <NumberIncrementStepper>
            <Icon as={BiCaretUp} transform="translate(0, 3px)" />
          </NumberIncrementStepper>
          <NumberDecrementStepper>
            <Icon as={BiCaretDown} transform="translate(0, -3px)" />
          </NumberDecrementStepper>
        </NumberInputStepper>
      </ChakraNumberInput>
    )
  },
)
