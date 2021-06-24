import { useMemo } from 'react'
import {
  forwardRef,
  Icon,
  Input as ChakraInput,
  InputGroup,
  InputProps as ChakraInputProps,
  InputRightElement,
} from '@chakra-ui/react'

import { BxsCheckCircle } from '~assets/icons/BxsCheckCircle'

export interface InputProps extends ChakraInputProps {
  /**
   * Whether the input is in a prefilled state.
   */
  isPrefilled?: boolean
  /**
   * Whether the input is in a success state.
   */
  isSuccess?: boolean
}

export const Input = forwardRef<InputProps, 'input'>(
  ({ isSuccess, isPrefilled, ...props }, ref) => {
    const extraInputProps = useMemo(() => {
      let extraProps = {}
      if (isSuccess) {
        extraProps = {
          borderColor: 'success.700',
          _hover: {
            borderColor: 'success.700',
          },
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

    if (!isSuccess) {
      return <ChakraInput ref={ref} {...extraInputProps} {...props} />
    }

    return (
      <InputGroup>
        <ChakraInput ref={ref} {...extraInputProps} {...props} />
        {isSuccess && (
          <InputRightElement pointerEvents="none" fontSize="1.25rem">
            <Icon as={BxsCheckCircle} color="success.700" />
          </InputRightElement>
        )}
      </InputGroup>
    )
  },
)
