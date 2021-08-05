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
  chakra,
  forwardRef,
  HTMLChakraProps,
  layoutPropNames,
  omitThemingProps,
  SystemProps,
  SystemStyleObject,
  ThemingProps,
  useMultiStyleConfig,
  useRadio,
  useRadioGroupContext,
  UseRadioProps,
} from '@chakra-ui/react'
import { callAll, split } from '@chakra-ui/utils'

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
}

/**
 * Radio component is used in forms when a user needs to select a single value from
 * several options.
 *
 * @see Docs https://chakra-ui.com/radio
 */
export const Radio = forwardRef<RadioProps, 'input'>((props, ref) => {
  const { onChange: onChangeProp, value: valueProp } = props

  const group = useRadioGroupContext()
  const styles = useMultiStyleConfig('Radio', { ...group, ...props })

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

  const [layoutProps, otherProps] = split(htmlProps, layoutPropNames as any)

  const checkboxProps = getCheckboxProps(otherProps)
  const inputProps = getInputProps({}, ref)
  const labelProps = getLabelProps()

  const rootStyles = {
    width: isFullWidth ? 'full' : undefined,
    display: 'inline-flex',
    alignItems: 'center',
    verticalAlign: 'top',
    ...styles.container,
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
      {...getLabelProps()}
      __css={rootStyles}
    >
      <input className="chakra-radio__input" {...inputProps} />
      <chakra.span
        className="chakra-radio__control"
        {...checkboxProps}
        __css={checkboxStyles}
      />
      {children && (
        <chakra.span
          className="chakra-radio__label"
          {...labelProps}
          __css={labelStyles}
        >
          {children}
        </chakra.span>
      )}
    </chakra.label>
  )
})
