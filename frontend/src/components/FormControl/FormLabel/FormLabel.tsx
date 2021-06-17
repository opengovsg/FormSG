import {
  FormLabel as ChakraFormLabel,
  FormLabelProps as ChakraFormLabelProps,
} from '@chakra-ui/form-control'

export type FormLabelProps = ChakraFormLabelProps

/**
 * @preconditions Must be a child of Chakra's `FormControl` component.
 * Used to enhance the usability of form controls.
 *
 * It is used to inform users as to what information
 * is requested for a form field.
 *
 * ♿️ Accessibility: Every form field should have a form label.
 */
export const FormLabel = ({
  children,
  ...props
}: FormLabelProps): JSX.Element => {
  return <ChakraFormLabel {...props}>{children}</ChakraFormLabel>
}
