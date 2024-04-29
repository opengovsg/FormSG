import {
  Box,
  chakra,
  forwardRef,
  InputGroup,
  InputLeftAddon,
  NumberInputProps as ChakraNumberInputProps,
  PropsOf,
  Text,
  useFormControlProps,
  useMultiStyleConfig,
  useNumberInput,
} from '@chakra-ui/react'

import { ThemeColorScheme } from '~theme/foundations/colours'

export interface MoneyInputProps
  extends ChakraNumberInputProps,
    Omit<PropsOf<'input'>, keyof ChakraNumberInputProps> {
  /**
   * Whether the input is in a prefilled state.
   */
  isPrefilled?: boolean
  /**
   * Whether the input is in a success state.
   */
  isSuccess?: boolean
  /**
   * Color scheme of number input.
   */
  colorScheme?: ThemeColorScheme
  /**
   * Whether to prevent default on user pressing the 'Enter' key.
   */
  preventDefaultOnEnter?: boolean
}

export const MoneyInput = forwardRef<MoneyInputProps, 'input'>(
  (
    {
      clampValueOnBlur = false,
      focusInputOnChange = false,
      isSuccess,
      isPrefilled,
      preventDefaultOnEnter,
      ...props
    },
    ref,
  ) => {
    const styles = useMultiStyleConfig('NumberInput', {
      ...props,
      isSuccess,
      isPrefilled,
    })

    /**
     * Used here so this component can retrieve a parent FormControl's props, if
     * any. This allows a FormControl parent component to pass props such as
     * isInvalid, isDisabled, etc, to this component.
     */
    const controlProps = useFormControlProps(props)
    const { htmlProps, getInputProps } = useNumberInput({
      ...controlProps,
      clampValueOnBlur,
      focusInputOnChange,
    })

    const inputProps = getInputProps({ placeholder: props.placeholder })

    return (
      <Box {...htmlProps} __css={styles.root}>
        {/* Using base input wrapper instead of `Input` component as the Input 
        component strips out some props such as `aria-invalid`, resulting in
        incorrect styling */}
        <InputGroup>
          <InputLeftAddon
            aria-disabled={inputProps.disabled}
            as="label"
            sx={styles.country}
            background="transparent"
            borderColor="neutral.400"
          >
            <Text>S$</Text>
          </InputLeftAddon>
          <chakra.input
            {...inputProps}
            // This flag should be set for form input fields, to prevent refresh on enter if form only has one input
            {...(preventDefaultOnEnter
              ? {
                  onKeyDown: (e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                    }
                  },
                }
              : {})}
            // Passing in ref to the input element so that it can be focused by
            // the parent.
            // No point passing the ref to the div wrapper as the main component
            // is this input.
            ref={ref}
            __css={styles.field}
            borderLeftRadius={0}
          />
        </InputGroup>
      </Box>
    )
  },
)
