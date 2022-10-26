import {
  Box,
  FormErrorIcon,
  FormErrorMessage as ChakraFormErrorMessage,
  FormErrorMessageProps as ChakraFormErrorMessageProps,
} from '@chakra-ui/react'

import { BxsErrorCircle } from '~assets/icons'

export type FormErrorMessageProps = ChakraFormErrorMessageProps

/**
 * @precondition This element should be instantiated as a child of ChakraUI's
 * `FormControl` element, and `FormControl` must have an `isInvalid = true` prop
 * before this element will be displayed.
 *
 * Used to provide feedback about an invalid input, and suggest clear instructions on how to fix it.
 */
export const FormErrorMessage = ({
  children,
  ...props
}: FormErrorMessageProps): JSX.Element => {
  return (
    <ChakraFormErrorMessage alignItems="top" {...props}>
      {children ? <FormErrorIcon h="1.5rem" as={BxsErrorCircle} /> : null}
      {typeof children === 'string' ? (
        // Align line base height with icon (if any)
        <Box my="0.125rem">{children}</Box>
      ) : (
        children
      )}
    </ChakraFormErrorMessage>
  )
}
