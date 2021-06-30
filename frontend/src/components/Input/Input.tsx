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

export const Input = forwardRef<InputProps, 'input'>((props, ref) => {
  const { isSuccess } = props

  if (!isSuccess) {
    return <ChakraInput ref={ref} {...props} />
  }

  return (
    <InputGroup>
      <ChakraInput ref={ref} {...props} />
      {isSuccess && (
        <InputRightElement pointerEvents="none" fontSize="1.25rem">
          <Icon as={BxsCheckCircle} color="success.700" />
        </InputRightElement>
      )}
    </InputGroup>
  )
})

/**
 * This is used in by Chakra's `InputGroup` component to remove border radii
 * when paired with `InputLeftAddon` or `InputRightAddon`.
 *
 * See https://github.com/chakra-ui/chakra-ui/blob/main/packages/input/src/input.tsx#L70 and
 * https://github.com/chakra-ui/chakra-ui/blob/main/packages/input/src/input-group.tsx#L58.
 */
Input.id = 'Input'
