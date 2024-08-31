import { ChangeEventHandler, ReactNode, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Checkbox as ChakraCheckbox,
  CheckboxProps as ChakraCheckboxProps,
  ComponentWithAs,
  forwardRef,
  Icon,
  useMergeRefs,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { BxCheckAnimated } from '~/assets/icons'
import { CHECKBOX_THEME_KEY } from '~/theme/components/Checkbox'
import { FieldColorScheme } from '~/theme/foundations/colours'

import Input, { InputProps } from '../Input'

import { CheckboxOthersContext, useCheckboxOthers } from './useCheckboxOthers'

export interface CheckboxProps extends ChakraCheckboxProps {
  /**
   * Background and shadow colors of checkbox.
   */
  colorScheme?: FieldColorScheme
}

type CheckboxWithOthers = ComponentWithAs<'input', CheckboxProps> & {
  OthersCheckbox: typeof OthersCheckbox
  OthersInput: typeof OthersInput
  OthersWrapper: typeof OthersWrapper
}

export const Checkbox = forwardRef<CheckboxProps, 'input'>(
  ({ children, colorScheme = 'primary', ...props }, ref) => {
    // Passing all props for cleanliness but the size prop is the most relevant
    const { icon: iconStyles } = useMultiStyleConfig(CHECKBOX_THEME_KEY, props)
    return (
      <ChakraCheckbox
        icon={
          <Icon
            as={BxCheckAnimated}
            __css={iconStyles}
            aria-label={`Checkbox icon, ${props.isChecked ? '' : 'un'}checked`}
            // This prop needs to be passed explicitly for animations
            isChecked={props.isChecked}
          />
        }
        colorScheme={colorScheme}
        ref={ref}
        {...props}
      >
        {children}
      </ChakraCheckbox>
    )
  },
) as CheckboxWithOthers

/**
 * Components to support the "Others" option.
 */

export interface CheckboxOthersWrapperProps {
  colorScheme?: FieldColorScheme
  size?: string
  children: ReactNode
}

/**
 * Provides context values for the Others option.
 */
const OthersWrapper = ({
  children,
  ...props
}: CheckboxOthersWrapperProps): JSX.Element => {
  const checkboxRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Passing all props for cleanliness but size and colorScheme are the most relevant
  const styles = useMultiStyleConfig(CHECKBOX_THEME_KEY, props)

  return (
    <CheckboxOthersContext.Provider value={{ checkboxRef, inputRef }}>
      <Box __css={styles.othersContainer}>{children}</Box>
    </CheckboxOthersContext.Provider>
  )
}

/**
 * Wrapper for the checkbox part of the Others option.
 */
const OthersCheckbox = forwardRef<CheckboxProps, 'input'>((props, ref) => {
  const { t } = useTranslation()
  const { checkboxRef, inputRef } = useCheckboxOthers()
  // Passing all props for cleanliness but size and colorScheme are the most relevant
  const styles = useMultiStyleConfig(CHECKBOX_THEME_KEY, props)

  const mergedCheckboxRef = useMergeRefs(checkboxRef, ref)

  const handleCheckboxChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    // Upon checking checkbox, focus text input
    if (e.target.checked) {
      inputRef.current?.focus()
    }
    props.onChange?.(e)
  }

  return (
    <Checkbox
      ref={mergedCheckboxRef}
      __css={styles.othersCheckbox}
      aria-label="Others"
      {...props}
      onChange={handleCheckboxChange}
    >
      {t('features.adminForm.sidebar.fields.radio.others')}
    </Checkbox>
  )
})

/**
 * Wrapper for the input part of the Others option.
 */
const OthersInput = forwardRef<InputProps, 'input'>((props, ref) => {
  const { checkboxRef, inputRef } = useCheckboxOthers()
  // Passing all props for cleanliness but size and colorScheme are the most relevant
  const styles = useMultiStyleConfig(CHECKBOX_THEME_KEY, props)

  const mergedInputRef = useMergeRefs(inputRef, ref)

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    // If there is text in the input, ensure the checkbox is checked.
    if (e.target.value && !checkboxRef.current?.checked) {
      checkboxRef.current?.click()
    }
    props.onChange?.(e)
  }

  return (
    <Input
      sx={styles.othersInput}
      ref={mergedInputRef}
      {...props}
      onChange={handleInputChange}
    />
  )
})

Checkbox.OthersWrapper = OthersWrapper
Checkbox.OthersCheckbox = OthersCheckbox
Checkbox.OthersInput = OthersInput
