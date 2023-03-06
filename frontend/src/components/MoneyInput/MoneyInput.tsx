import {
  Box,
  chakra,
  forwardRef,
  HStack,
  Icon,
  InputGroup,
  InputLeftAddon,
  NumberInputProps as ChakraNumberInputProps,
  Text,
  useFormControlProps,
  useMergeRefs,
  useMultiStyleConfig,
  useNumberInput,
} from '@chakra-ui/react'
import Flags from 'country-flag-icons/react/3x2'

import { ThemeColorScheme } from '~theme/foundations/colours'

export interface MoneyInputProps extends ChakraNumberInputProps {
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
      colorScheme,
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

    const inputRef = useMergeRefs(inputProps.ref, ref)

    // TODO: replace with dynamic country loading if/when more currencies are added
    const country = 'SG'

    // TODO: refactor list into a separate file with all currencies if/when more currencies are added
    const currency = {
      SG: 'SGD',
    }

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
            <HStack align="center" spacing={2}>
              <Icon
                // Show Flags if available. If value does not exist for any reason,
                // a default fallback icon will be used by ChakraUI.
                // See https://chakra-ui.com/docs/media-and-icons/icon#fallback-icon.
                as={Flags[country]}
                role="img"
                __css={styles.icon}
              />
              <Text>{currency[country]}</Text>
            </HStack>
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
            ref={inputRef}
            __css={styles.field}
            borderLeftRadius={0}
          />
        </InputGroup>
      </Box>
    )
  },
)
