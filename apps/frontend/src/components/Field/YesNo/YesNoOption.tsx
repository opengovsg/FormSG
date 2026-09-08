import { KeyboardEvent, useCallback, useEffect, useState } from 'react'
import { IconType } from 'react-icons/lib'
import {
  Box,
  forwardRef,
  Icon,
  ThemingProps,
  useMultiStyleConfig,
  useRadio,
  UseRadioGroupReturn,
  UseRadioProps,
} from '@chakra-ui/react'

import { YESNO_THEME_KEY } from '~theme/components/Field/YesNo'
import { FieldColorScheme } from '~theme/foundations/colours'

interface YesNoOptionProps extends UseRadioProps {
  /**
   * Icon to be displayed to the left of the option content.
   */
  leftIcon?: IconType

  /**
   * Label to be displayed as the option content.
   */
  label: string

  /**
   * Side of the option for styling to be used for styling.
   */
  side: 'left' | 'right'

  /**
   * Color scheme of the component to render. Defaults to `primary`.
   */
  colorScheme?: FieldColorScheme

  /**
   * Callback to be invoked when selection changes.
   * @note Overridden to allow onChange with both a value or event argument
   * instead of the default event-only argument.
   */
  onChange?: UseRadioGroupReturn['onChange']

  size?: ThemingProps<'Radio'>['size']

  isHighContrast?: boolean
}

/**
 * Option rendering for `YesNo` component.
 */
export const YesNoOption = forwardRef<YesNoOptionProps, 'input'>(
  ({ leftIcon, label, ...props }, ref) => {
    const styles = useMultiStyleConfig(YESNO_THEME_KEY, props)

    const { getInputProps, getCheckboxProps } = useRadio(props)
    // Empty object needed here as ref is the second argument,
    // and ref is required so that any refs passed in gets forwarded.
    const inputProps = getInputProps(undefined, ref)
    const checkboxProps = getCheckboxProps()

    const handleSelect = useCallback(() => {
      // Do not do anything if the input is readonly
      if (props.isChecked && !props.isReadOnly) {
        /**
         * onChange prop is meant to be called when the current value of the
         * checkbox group is updated.
         * Here onChange is being called to reset the current checkbox value by
         * setting the current value to an empty value if the current checkbox
         * is already checked, effectively allowing toggling of the checkbox.
         */
        props.onChange?.('')
      }
    }, [props])

    const handleSpacebar = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== ' ') return
        if (props.isChecked) {
          e.preventDefault()
          handleSelect()
        }
      },
      [handleSelect, props.isChecked],
    )

    // Manually track the pressed state instead of relying on the native
    // `:active` pseudo-class, since a `<label>` associated with a form
    // control stays `:active` even after the cursor is dragged away from
    // it, only clearing on the next hover instead of on mouseup.
    const [isPressed, setIsPressed] = useState(false)

    const handleMouseDown = useCallback(() => {
      if (props.isDisabled || props.isReadOnly) return
      setIsPressed(true)
    }, [props.isDisabled, props.isReadOnly])

    useEffect(() => {
      if (!isPressed) return
      const handleMouseUp = () => setIsPressed(false)
      window.addEventListener('mouseup', handleMouseUp)
      return () => window.removeEventListener('mouseup', handleMouseUp)
    }, [isPressed])

    return (
      <Box
        as="label"
        __css={styles.container}
        data-testid={`${props.name}-${props.side}`}
        ml={props.side === 'right' ? '-1px' : undefined}
        role="button"
        ref={ref}
        onMouseDown={handleMouseDown}
        aria-label={`${props.title} ${label} option, ${
          props.isChecked ? 'selected' : 'unselected'
        }`}
      >
        <input
          {...inputProps}
          onClick={handleSelect}
          onKeyDown={handleSpacebar}
          aria-hidden
        />
        <Box
          {...checkboxProps}
          __css={styles.option}
          data-active={isPressed || undefined}
          aria-hidden
        >
          {leftIcon ? <Icon as={leftIcon} __css={styles.icon} /> : null}
          {label}
        </Box>
      </Box>
    )
  },
)
