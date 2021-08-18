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

import { ChangeEventHandler, ReactNode, useRef, useState } from 'react'
import {
  Box,
  chakra,
  ComponentWithAs,
  CSSObject,
  forwardRef,
  HTMLChakraProps,
  layoutPropNames,
  omitThemingProps,
  RadioGroup as ChakraRadioGroup,
  RadioGroupProps as ChakraRadioGroupProps,
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

import { RadioGroupContext, useRadioGroupWithOthers } from './useRadioGroup'

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
}

type RadioWithOthers = ComponentWithAs<'input', RadioProps> & {
  Others: typeof Others
  RadioGroup: typeof RadioGroup
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
}) as RadioWithOthers

/**
 * Components to support the "Others" option.
 */

export interface RadioOthersWrapperProps {
  colorScheme?: FieldColorScheme
  size?: string
  children: ReactNode
}

/**
 * Provides styling for the container of the Others radio
 * button and text input.
 */
const OthersWrapper = ({
  colorScheme,
  size,
  children,
}: RadioOthersWrapperProps): JSX.Element => {
  const styles = useMultiStyleConfig(RADIO_THEME_KEY, {
    size,
    colorScheme,
  })

  return <Box __css={styles.othersContainer}>{children}</Box>
}

/**
 * Wrapper for the radio part of the Others option.
 */
const OthersRadio = forwardRef<RadioProps, 'input'>((props, ref) => {
  const { othersRadioRef, othersInputRef } = useRadioGroupWithOthers()
  const styles = useMultiStyleConfig(RADIO_THEME_KEY, {
    size: props.size,
    colorScheme: props.colorScheme,
  })

  const mergedRadioRef = useMergeRefs(othersRadioRef, ref)

  const handleRadioChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    // Upon selecting radio, focus text input
    if (e.target.checked) {
      othersInputRef.current?.focus()
    }
    props.onChange?.(e)
  }

  return (
    <Radio
      ref={mergedRadioRef}
      {...props}
      __css={styles.othersRadio}
      onChange={handleRadioChange}
      // This value doesn't matter as it will be overridden by the
      // value in the text input, but it needs to be present in order
      // for the radio group to work properly
      value="Other"
    >
      Other
    </Radio>
  )
})

/**
 * Wrapper for the input part of the Others option.
 */
const OthersInput = forwardRef<InputProps, 'input'>((props, ref) => {
  const {
    othersRadioRef,
    othersInputRef,
    othersInputValue,
    onInputValueChange,
  } = useRadioGroupWithOthers()
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
    onInputValueChange(e.target.value)
  }

  return (
    <Input
      sx={styles.othersInput}
      ref={mergedInputRef}
      {...props}
      value={othersInputValue}
      onChange={handleInputChange}
    />
  )
})

/**
 * Return value of a radio group. This covers all possible edge
 * cases such as:
 * - Text is present in Others input, but "Others" radio button
 * is not selected (answer should be whichever radio button is selected)
 * - Text is present in Others input, "Others" radio button is
 * selected and text is identical to one of the non-Others option
 * (parent should be able to know that the answer is from the text input,
 * not one of the radio options)
 *
 */
export type RadioGroupReturn = { value: string; isOthers: boolean }

export interface RadioGroupProps
  extends Omit<ChakraRadioGroupProps, 'onChange'> {
  onChange: (value: RadioGroupReturn) => void
}

/**
 * Container for a group of radio buttons.
 */
const RadioGroup = ({
  onChange,
  children,
  ...props
}: RadioGroupProps): JSX.Element => {
  const othersRadioRef = useRef<HTMLInputElement>(null)
  const othersInputRef = useRef<HTMLInputElement>(null)
  const [othersInputValue, setOthersInputValue] = useState('')

  const [internalValue, setInternalValue] = useState<string | undefined>(
    undefined,
  )

  const handleRadioChange = (newValue: string): void => {
    setInternalValue(newValue)
    // Others selected, let parent check value of input
    if (othersRadioRef?.current?.checked) {
      return onChange({
        value: othersInputValue,
        isOthers: true,
      })
    }
    return onChange({
      value: newValue,
      isOthers: false,
    })
  }

  const onInputValueChange = (newValue: string): void => {
    setOthersInputValue(newValue)
    return onChange({
      value: newValue,
      isOthers: !!othersRadioRef?.current?.checked,
    })
  }

  return (
    <RadioGroupContext.Provider
      value={{
        othersRadioRef,
        othersInputRef,
        othersInputValue,
        onInputValueChange,
      }}
    >
      <ChakraRadioGroup
        {...props}
        value={internalValue}
        onChange={handleRadioChange}
      >
        {children}
      </ChakraRadioGroup>
    </RadioGroupContext.Provider>
  )
}

export interface OthersProps {
  radioProps?: RadioProps
  inputProps?: InputProps
}

const Others = (props: OthersProps): JSX.Element => {
  return (
    <OthersWrapper>
      <OthersRadio {...props.radioProps} />
      <OthersInput {...props.inputProps} />
    </OthersWrapper>
  )
}

Radio.Others = Others
Radio.RadioGroup = RadioGroup
