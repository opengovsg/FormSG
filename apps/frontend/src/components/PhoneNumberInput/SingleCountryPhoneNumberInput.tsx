import {
  forwardRef,
  Icon,
  InputGroup,
  InputRightElement,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import Flags from 'country-flag-icons/react/3x2'

import Input from '~components/Input'

import { BasePhoneNumberInputProps } from './PhoneNumberInput'
import { usePhoneNumberInput } from './PhoneNumberInputContext'

export const SingleCountryPhoneNumberInput = forwardRef<
  BasePhoneNumberInputProps,
  'input'
>((props, ref) => {
  const {
    inputValue,
    inputPlaceholder,
    handleInputChange,
    handleInputBlur,
    country,
  } = usePhoneNumberInput()

  const styles = useMultiStyleConfig('SingleCountryPhoneNumberInput', props)

  return (
    <InputGroup>
      <Input
        ref={ref}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        value={inputValue}
        placeholder={inputPlaceholder}
        preventDefaultOnEnter
        {...props}
        sx={styles.field}
      />
      <InputRightElement
        sx={styles.iconContainer}
        aria-disabled={props.isDisabled}
      >
        <Icon
          // Show Flags if available. If value does not exist for any reason,
          // a default fallback icon will be used by ChakraUI.
          // See https://chakra-ui.com/docs/media-and-icons/icon#fallback-icon.
          as={Flags[country]}
          role="img"
          aria-label={`Only ${country} numbers are allowed`}
          __css={styles.icon}
        />
      </InputRightElement>
    </InputGroup>
  )
})
