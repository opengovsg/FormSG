import { KeyboardEvent, useCallback, useMemo } from 'react'
import { BiCheck, BiX } from 'react-icons/bi'
import {
  Box,
  forwardRef,
  HStack,
  Icon,
  useMultiStyleConfig,
  useRadio,
  useRadioGroup,
  UseRadioGroupProps,
  UseRadioGroupReturn,
  UseRadioProps,
  VisuallyHidden,
} from '@chakra-ui/react'

import { YESNO_THEME_KEY } from '~theme/components/Field/YesNo'
import { FieldColorScheme } from '~theme/foundations/colours'

export interface YesNoProps {
  /**
   * Whether YesNo component is disabled.
   */
  isDisabled?: boolean
  /**
   * Function called once a radio is checked
   * @param nextValue the value of the checked radio
   */
  onChange?: UseRadioGroupProps['onChange']
  /**
   * The value of the radio to be `checked`
   * (in controlled mode)
   */
  value?: 'yes' | 'no'
  /**
   * The value of the radio to be `checked`
   * initially (in uncontrolled mode)
   */
  defaultValue?: 'yes' | 'no'
  /**
   * The `name` attribute forwarded to each `radio` element
   */
  name: string

  /**
   * Color scheme of the component to render. Defaults to `primary`.
   */
  colorScheme?: FieldColorScheme
}

interface YesNoOptionProps extends UseRadioProps {
  children: React.ReactNode

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
   * @note Overridden since this component must be encapsulated by a
   * `RadioGroup` component and will pass in its `onChange` callback as a prop.
   */
  onChange?: UseRadioGroupReturn['onChange']
}

const YesNoOption = forwardRef<YesNoOptionProps, 'input'>(
  ({ children, ...props }, ref) => {
    const styles = useMultiStyleConfig(YESNO_THEME_KEY, props)

    const { getInputProps, getCheckboxProps } = useRadio({
      ...props,
    })
    // Empty object needed here as ref is the second argument,
    // and ref is required so that any refs passed in gets forwarded.
    const input = getInputProps(undefined, ref)

    const checkbox = getCheckboxProps()

    const handleSelect = useCallback(() => {
      if (props.isChecked) {
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

    return (
      <Box
        as="label"
        w="100%"
        zIndex={props.isChecked ? 1 : 'initial'}
        _active={{ zIndex: 1 }}
        _focusWithin={{ zIndex: 1 }}
      >
        <input {...input} onClick={handleSelect} onKeyDown={handleSpacebar} />
        <VisuallyHidden>
          "{children}" option {props.isChecked ? 'selected' : 'unselected'}
        </VisuallyHidden>
        <Box {...checkbox} __css={styles.option}>
          {children}
        </Box>
      </Box>
    )
  },
)

export const YesNo = forwardRef<YesNoProps, 'input'>(
  ({ isDisabled, colorScheme = 'primary', ...props }, ref) => {
    const { getRootProps, getRadioProps } = useRadioGroup(props)

    const groupProps = getRootProps()
    const [noProps, yesProps] = useMemo(() => {
      const baseProps = {
        enterKeyHint: '',
        isDisabled,
      }
      return [
        getRadioProps({
          value: 'no',
          ...baseProps,
        }),
        getRadioProps({
          value: 'yes',
          ...baseProps,
        }),
      ]
    }, [getRadioProps, isDisabled])

    return (
      // -1px so borders collapse
      <HStack spacing="-1px" {...groupProps}>
        {/* Ref is set here so any errors can focus this input */}
        <YesNoOption
          side="left"
          colorScheme={colorScheme}
          {...noProps}
          ref={ref}
        >
          <Icon
            display={['none', 'none', 'initial']}
            as={BiX}
            fontSize="1.5rem"
            mr="0.5rem"
            aria-hidden
          />
          No
        </YesNoOption>
        <YesNoOption side="right" colorScheme={colorScheme} {...yesProps}>
          <Icon
            display={['none', 'none', 'initial']}
            as={BiCheck}
            fontSize="1.5rem"
            mr="0.5rem"
            aria-hidden
          />
          Yes
        </YesNoOption>
      </HStack>
    )
  },
)
