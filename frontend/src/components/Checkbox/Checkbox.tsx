import {
  Checkbox as ChakraCheckbox,
  CheckboxProps as ChakraCheckboxProps,
  forwardRef,
  Icon,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { BxCheckAnimated } from '~/assets/icons'
import { CHECKBOX_THEME_KEY } from '~/theme/components/Checkbox'
import { FieldColorScheme } from '~/theme/foundations/colours'

export interface CheckboxProps extends ChakraCheckboxProps {
  colorScheme?: FieldColorScheme
}

export const Checkbox = forwardRef<CheckboxProps, 'input'>(
  ({ children, colorScheme = 'primary', ...props }, ref) => {
    const { icon: iconStyles } = useMultiStyleConfig(CHECKBOX_THEME_KEY, {
      size: props.size,
    })
    return (
      <ChakraCheckbox
        icon={
          <Icon
            as={BxCheckAnimated}
            __css={iconStyles}
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
)
