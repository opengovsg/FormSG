import { useMemo } from 'react'
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
} from '@chakra-ui/react'

import { BxsCheckCircle } from '~assets/icons/BxsCheckCircle'
import { SX_STEPPER_WIDTH } from '~theme/components/NumberInput'

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
  ({ isPrefilled, isSuccess, ...props }, ref) => {
    const extraInputProps = useMemo(() => {
      let extraProps = {}
      if (isSuccess) {
        extraProps = {
          borderColor: 'success.700',
          _hover: {
            borderColor: 'success.700',
          },
          paddingInlineEnd: `calc(var(${SX_STEPPER_WIDTH}) + 2.5rem)`,
        }
      }
      // Add background if isPrefilled.
      if (isPrefilled) {
        extraProps = {
          ...extraProps,
          bg: 'warning.100',
        }
      }
      return extraProps
    }, [isPrefilled, isSuccess])

    return (
      <ChakraNumberInput {...props} ref={ref}>
        <NumberInputField {...extraInputProps} />
        {isSuccess && (
          <InputRightElement
            pointerEvents="none"
            fontSize="1.25rem"
            mr={`var(${SX_STEPPER_WIDTH})`}
          >
            <Icon as={BxsCheckCircle} color="success.700" />
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
