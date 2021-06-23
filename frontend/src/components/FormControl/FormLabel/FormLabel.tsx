import {
  Box,
  FormLabel as ChakraFormLabel,
  FormLabelProps as ChakraFormLabelProps,
  Icon,
  Text,
  TextProps,
  Tooltip,
  useFormControlContext,
} from '@chakra-ui/react'

import { BxsHelpCircle } from '~/assets/icons/BxsHelpCircle'

export interface FormLabelProps extends ChakraFormLabelProps {
  /**
   * Question number to be prefixed before each label, if any.
   */
  questionNumber?: string

  /**
   * Tooltip text to be postfixed at the end of each label, if any.
   */
  tooltipText?: string

  /**
   * Label text.
   */
  children: React.ReactNode

  /**
   * Whether form label is required. This is optional; if this prop is not
   * provided, the value from it's parent `FormContext` (if any) will be used.
   */
  isRequired?: boolean
}

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
  isRequired,
  tooltipText,
  questionNumber,
  children,
}: FormLabelProps): JSX.Element => {
  return (
    <FormLabel.Label d="flex" requiredIndicator={<Box />}>
      {questionNumber && (
        <FormLabel.QuestionNumber>{questionNumber}</FormLabel.QuestionNumber>
      )}
      <Box>
        {children}
        <FormLabel.OptionalIndicator isRequired={isRequired} />
        {tooltipText && (
          <Tooltip label={tooltipText}>
            <Icon ml="0.5rem" as={BxsHelpCircle} />
          </Tooltip>
        )}
      </Box>
    </FormLabel.Label>
  )
}

FormLabel.Label = ({
  children,
  ...props
}: ChakraFormLabelProps): JSX.Element => {
  return (
    <ChakraFormLabel d="flex" {...props}>
      {children}
    </ChakraFormLabel>
  )
}

FormLabel.QuestionNumber = (props: TextProps): JSX.Element => {
  return (
    <Text
      as="span"
      textStyle="caption-1"
      color="secondary.700"
      mr="0.5rem"
      lineHeight="1.5rem"
      {...props}
    />
  )
}

FormLabel.OptionalIndicator = (
  props: TextProps & { isRequired?: boolean },
): JSX.Element | null => {
  // Valid hook usage since composited component is still a component.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const field = useFormControlContext()

  if (props.isRequired || field?.isRequired) return null

  return (
    <Text
      as="span"
      role="presentation"
      textStyle="body-2"
      ml="0.5rem"
      color="neutral.700"
      {...props}
    >
      (optional)
    </Text>
  )
}
