/**
 * This file is a slightly modified version of Chakra UI's internal Radio
 * implementation, which can be found here:
 * https://github.com/chakra-ui/chakra-ui/blob/main/packages/radio/src/radio.tsx
 *
 * Limitations of Chakra's Radio mean that we cannot implement our desired
 * design with the existing implementation. In particular, the "disabled"
 * attribute does not apply to the label which wraps the component, meaning
 * we cannot apply the correct styles to the Radio container when the button
 * inside it is disabled (e.g. { cursor: 'not-allowed', bg: 'none' }).
 *
 * Hence this code is adapted to apply the desired styles to the label which
 * wraps the component.
 *
 * The relevant issue in the Chakra UI repo is here:
 * https://github.com/chakra-ui/chakra-ui/issues/4295
 */

import {
  ChangeEvent,
  ChangeEventHandler,
  KeyboardEvent,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import {
  Box,
  chakra,
  ComponentWithAs,
  CSSObject,
  forwardRef,
  HTMLChakraProps,
  layoutPropNames,
  omitThemingProps,
  SystemProps,
  SystemStyleObject,
  ThemingProps,
  useMergeRefs,
  useMultiStyleConfig,
  useRadio,
  useRadioGroupContext,
  UseRadioProps,
} from '@chakra-ui/react'
import { callAll, split } from '@chakra-ui/utils'

import { RADIO_THEME_KEY } from '~/theme/components/Radio'
import { FieldColorScheme } from '~/theme/foundations/colours'

import Input, { InputProps } from '../Input'

import { RadioGroup } from './RadioGroup'
import { useRadioGroupWithOthers } from './useRadioGroupWithOthers'

type Omitted = 'onChange' | 'defaultChecked' | 'checked'
type BaseControlProps = Omit<HTMLChakraProps<'div'>, Omitted>

export interface RadioProps
  extends UseRadioProps,
    ThemingProps<'Radio'>,
    BaseControlProps {
  /**
   * The spacing between the checkbox and its label text
   * @default 0.5rem
   * @type SystemProps["marginLeft"]
   */
  spacing?: SystemProps['marginLeft']
  /**
   * If `true`, the radio will occupy the full width of its parent container
   *
   * @deprecated
   * This component defaults to 100% width,
   * please use the props `maxWidth` or `width` to configure
   */
  isFullWidth?: boolean
  /**
   * Background and shadow colors.
   */
  colorScheme?: FieldColorScheme
  /**
   * Additional overriding styles. This is a change from the Chakra UI
   * implementation, which previously did not allow overriding styles.
   */
  __css?: CSSObject

  /**
   * Function called when checked state of the input changes
   * If provided (and if @param allowDeselect is `true`), will be called with empty string when user attempts to
   * deselect the radio.
   */
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void

  /**
   * Whether the radio button can be deselected once radio group has a value.
   * @default true
   */
  allowDeselect?: boolean
}

type RadioWithSubcomponentProps = ComponentWithAs<'input', RadioProps> & {
  OthersWrapper: typeof OthersWrapper
  RadioGroup: typeof RadioGroup
  OthersInput: typeof OthersInput
}

/**
 * Radio component is used in forms when a user needs to select a single value from
 * several options.
 *
 * @see Docs https://chakra-ui.com/radio
 */
export const Radio = forwardRef<RadioProps, 'input'>(
  ({ allowDeselect = true, ...props }, ref) => {
    const { onChange: onChangeProp, value: valueProp } = props

    const group = useRadioGroupContext()
    const styles = useMultiStyleConfig(RADIO_THEME_KEY, { ...group, ...props })

    const {
      spacing = '0.5rem',
      children,
      isFullWidth,
      ...rest
    } = omitThemingProps(props)

    let isChecked = props.isChecked
    if (group?.value != null && valueProp != null) {
      isChecked = group.value === valueProp
    }

    let onChange = onChangeProp
    if (group?.onChange && valueProp != null) {
      onChange = callAll(group.onChange, onChangeProp)
    }

    const name = props?.name ?? group?.name

    const { getInputProps, getCheckboxProps, getLabelProps, htmlProps } =
      useRadio({
        ...rest,
        isDisabled: props.isDisabled,
        isChecked,
        onChange,
        name,
      })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [layoutProps, otherProps] = split(htmlProps, layoutPropNames as any)

    const checkboxProps = getCheckboxProps(otherProps)
    const inputProps = getInputProps({}, ref)

    const handleSelect = useCallback(
      (e: SyntheticEvent) => {
        if (isChecked && allowDeselect) {
          e.preventDefault()
          // Toggle off if onChange is given.
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          onChange?.({ target: { value: '' } })
        }
      },
      [allowDeselect, isChecked, onChange],
    )

    const handleSpacebar = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== ' ') return
        if (isChecked && allowDeselect) {
          handleSelect(e)
        }
      },
      [allowDeselect, handleSelect, isChecked],
    )

    // Update labelProps to include props to allow deselection of radio value if
    // available
    const labelProps = useMemo(() => {
      return getLabelProps({
        onClick: handleSelect,
        onKeyDown: handleSpacebar,
      })
    }, [getLabelProps, handleSelect, handleSpacebar])

    const rootStyles = {
      width: isFullWidth ? 'full' : undefined,
      display: 'inline-flex',
      alignItems: 'center',
      verticalAlign: 'top',
      ...styles.container,
      ...props.__css,
    }

    const checkboxStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      ...styles.control,
    }

    const labelStyles: SystemStyleObject = {
      userSelect: 'none',
      marginStart: spacing,
      ...styles.label,
    }

    return (
      <chakra.label
        className="chakra-radio"
        {...layoutProps}
        // This is the adapted line of code which applies the internal label styles
        // to the whole container
        {...labelProps}
        __css={rootStyles}
      >
        <input
          className="chakra-radio__input"
          {...inputProps}
          aria-invalid={false}
        />
        <chakra.span
          className="chakra-radio__control"
          {...checkboxProps}
          __css={checkboxStyles}
        />
        {children && (
          <chakra.span className="chakra-radio__label" __css={labelStyles}>
            {children}
          </chakra.span>
        )}
      </chakra.label>
    )
  },
) as RadioWithSubcomponentProps

/**
 * Components to support the "Others" option.
 */

/**
 * Wrapper for the radio part of the Others option.
 */
const OthersRadio = forwardRef<RadioProps, 'input'>((props, ref) => {
  const { othersRadioRef, othersInputRef } = useRadioGroupWithOthers()
  const { value: valueProp } = props
  const styles = useMultiStyleConfig(RADIO_THEME_KEY, {
    size: props.size,
    colorScheme: props.colorScheme,
  })

  const mergedRadioRef = useMergeRefs(othersRadioRef, ref)

  const group = useRadioGroupContext()

  let isChecked = props.isChecked
  if (group?.value != null && valueProp != null) {
    isChecked = group.value === valueProp
  }

  useEffect(() => {
    if (isChecked) {
      othersInputRef.current?.focus()
    }
  }, [isChecked, othersInputRef])

  return (
    <Radio
      ref={mergedRadioRef}
      {...props}
      __css={styles.othersRadio}
      // Required should apply to radio group rather than individual radio.
      isRequired={false}
    >
      Others
    </Radio>
  )
})

/**
 * Wrapper for the input part of the Others option.
 */
export const OthersInput = forwardRef<InputProps, 'input'>(
  ({ onChange, ...props }, ref) => {
    const { othersRadioRef, othersInputRef } = useRadioGroupWithOthers()
    const styles = useMultiStyleConfig(RADIO_THEME_KEY, {
      size: props.size,
      colorScheme: props.colorScheme,
    })

    const mergedInputRef = useMergeRefs(othersInputRef, ref)

    const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
      // If user is typing text in the input, ensure the "Others" option is selected
      if (e.target.value && !othersRadioRef.current?.checked) {
        othersRadioRef.current?.click()
      }
      onChange?.(e)
    }

    return (
      <Input
        sx={styles.othersInput}
        ref={mergedInputRef}
        {...props}
        onChange={handleInputChange}
        // Required only when other radio is checked.
        isRequired={othersRadioRef.current?.checked}
      />
    )
  },
)

export interface OthersProps extends RadioProps {
  children: React.ReactNode
}

const OthersWrapper = forwardRef<OthersProps, 'input'>(
  ({ children, size, colorScheme, ...props }, ref) => {
    const styles = useMultiStyleConfig(RADIO_THEME_KEY, {
      size,
      colorScheme,
    })

    return (
      <Box __css={styles.othersContainer}>
        <OthersRadio {...props} ref={ref} />
        {children}
      </Box>
    )
  },
)

Radio.OthersWrapper = OthersWrapper
Radio.RadioGroup = RadioGroup
Radio.OthersInput = OthersInput
