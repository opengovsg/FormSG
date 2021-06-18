import { KeyboardEvent, useCallback, useMemo } from 'react'
import { BiCheck, BiX } from 'react-icons/bi'
import {
  Box,
  forwardRef,
  HStack,
  Icon,
  useRadio,
  useRadioGroup,
  UseRadioGroupProps,
  UseRadioGroupReturn,
  UseRadioProps,
  useStyleConfig,
} from '@chakra-ui/react'

import { YESNO_THEME_KEY } from '~theme/components/Field/YesNo'
import { ThemeColorScheme } from '~theme/foundations/colours'

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
  colorScheme?: ThemeColorScheme
}

interface YesNoOptionProps extends UseRadioProps {
  children: React.ReactNode

  /**
   * Variant of the option for styling to be used for styling.
   */
  variant: 'left' | 'right'

  /**
   * Color scheme of the component to render. Defaults to `primary`.
   */
  colorScheme?: ThemeColorScheme
}

const YesNoOption = forwardRef<YesNoOptionProps, 'input'>(
  ({ children, variant, colorScheme = 'primary', ...props }, ref) => {
    const style = useStyleConfig(YESNO_THEME_KEY, { variant, colorScheme })

    const { getInputProps, getCheckboxProps } = useRadio({
      ...props,
      isDisabled: props.disabled,
    })
    const input = getInputProps({}, ref)

    const checkbox = getCheckboxProps({})

    const handleSelect = useCallback(() => {
      if (props.isChecked && input.onChange) {
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;(input.onChange as UseRadioGroupReturn['onChange'])('')
      }
    }, [input.onChange, props.isChecked])

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
      <Box as="label" w="100%" zIndex={props.isChecked ? 1 : 'initial'}>
        <input {...input} onClick={handleSelect} onKeyDown={handleSpacebar} />
        <Box {...checkbox} aria-hidden={false} __css={style}>
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
      return [
        getRadioProps({ value: 'no', enterKeyHint: '', disabled: isDisabled }),
        getRadioProps({ value: 'yes', enterKeyHint: '', disabled: isDisabled }),
      ]
    }, [getRadioProps, isDisabled])

    return (
      <HStack spacing="-px" {...groupProps}>
        {/* Ref is set here so any errors can focus this input */}
        <YesNoOption
          variant="left"
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
        <YesNoOption variant="right" colorScheme={colorScheme} {...yesProps}>
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
