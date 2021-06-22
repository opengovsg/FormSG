import {
  Fragment,
  HTMLProps,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Box,
  forwardRef,
  useBreakpointValue,
  useRadio,
  useToken,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'

import { FieldColorScheme } from '~theme/foundations/colours'

interface RatingComponent {
  /**
   * Radio styling props to spread on container.
   */
  checkbox: Omit<HTMLProps<any>, never>
  /**
   * Whether component is checked.
   */
  isChecked: boolean
  /**
   * ID of the input this component is rendering for.
   */
  inputId: string | undefined
  /**
   * Color scheme of the component to render. Defaults to `primary`.
   */
  colorScheme?: FieldColorScheme

  children?: React.ReactNode
}
const NumberRating = ({
  checkbox,
  inputId,
  isChecked,
  colorScheme = 'primary',
  children,
}: RatingComponent): JSX.Element => {
  const themeColorVar = useMemo(() => {
    switch (colorScheme) {
      case 'theme-red':
      case 'theme-orange':
      case 'theme-yellow':
        return `${colorScheme}.700`
      default:
        return `${colorScheme}.500`
    }
  }, [colorScheme])

  const themeColor = useToken('colors', themeColorVar)

  return (
    <Box
      {...checkbox}
      as="label"
      htmlFor={inputId}
      aria-hidden={false}
      {...(isChecked ? { 'data-checked': '' } : {})}
      minW="3.25rem"
      display="flex"
      justifyContent="center"
      transitionProperty="common"
      transitionDuration="normal"
      cursor="pointer"
      py="10px"
      px="14px"
      bg="white"
      borderWidth="1px"
      borderColor={themeColor}
      color={themeColor}
      _disabled={{
        borderColor: 'neutral.500',
        color: 'neutral.500',
        cursor: 'not-allowed',

        _checked: {
          bg: 'neutral.500',
          _hover: {
            bg: 'neutral.500',
          },
        },
        _hover: {
          bg: 'white',
        },
        _active: {
          color: 'neutral.500',
          bg: 'white',
        },
      }}
      _hover={{
        bg: `${colorScheme}.200`,
      }}
      _active={{
        bg: themeColor,
        color: 'white',
      }}
      _focus={{
        boxShadow: `0 0 0 4px var(--chakra-colors-${colorScheme}-300)`,
      }}
      _checked={{
        bg: themeColor,
        color: 'white',
      }}
    >
      {children}
    </Box>
  )
}

export interface RatingProps {
  /**
   * The `name` attribute forwarded to each rating `radio` element
   */
  name: string
  /**
   * Number of rating options to render.
   */
  numberOfRatings: number
  /**
   * Color scheme of the component to render. Defaults to `primary`.
   */
  colorScheme?: FieldColorScheme
  /**
   * Function called once a rating is selected.
   * @param newRating the value of the checked radio
   */
  onChange?: (newRating: number | undefined) => void
  /**
   * Number of rating components to show per row when unable to display all
   * components on a single line. Defaults to `5`.
   */
  wrapComponentsPerRow?: number
  /**
   * The value of the rating to be `checked` initially.
   */
  defaultValue?: number

  /**
   * Variant of rating field to render
   */
  variant: 'Heart' | 'Star' | 'Number'
}

interface RatingOptionProps {
  /**
   * Color scheme of the component to render. Defaults to `primary`.
   */
  colorScheme?: FieldColorScheme
  /**
   * Value of the option.
   */
  value: number
  /**
   * Function called once a rating is selected.
   * @param newRating the value of the checked radio
   */
  onChange?: (newRating: number | undefined) => void
  /**
   * The current selected value in the rating group.
   */
  selectedValue?: number
  /**
   * The `name` attribute forwarded to the rating `radio` element
   */
  name: string

  /**
   * Variant of rating field to render
   */
  variant: 'Heart' | 'Star' | 'Number'
}

const RatingOption = forwardRef<RatingOptionProps, 'input'>(
  (
    {
      children,
      colorScheme = 'primary',
      name,
      onChange,
      selectedValue,
      value,
      variant,
    },
    ref,
  ) => {
    const handleSelect = useCallback(() => {
      if (selectedValue === value) {
        onChange?.(undefined)
      } else {
        onChange?.(value)
      }
    }, [onChange, selectedValue, value])

    const handleSpacebar = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== ' ') return
        if (selectedValue === value) {
          e.preventDefault()
          handleSelect()
        }
      },
      [handleSelect, selectedValue, value],
    )

    const { getInputProps, getCheckboxProps } = useRadio({
      name,
      id: `${name}-${value}`,
      onChange: handleSelect,
      value,
    })

    const input = getInputProps()
    const checkbox = getCheckboxProps()

    const ComponentToRender = useMemo(() => {
      switch (variant) {
        case 'Number':
        case 'Heart':
        case 'Star':
        default:
          return NumberRating
      }
    }, [variant])

    return (
      <Box _active={{ zIndex: 1 }} _focusWithin={{ zIndex: 1 }}>
        <input
          type="radio"
          aria-checked={selectedValue === value}
          {...input}
          onChange={handleSelect}
          onKeyDown={handleSpacebar}
          ref={ref}
        />
        <ComponentToRender
          checkbox={checkbox}
          isChecked={selectedValue === value}
          colorScheme={colorScheme}
          inputId={input.id}
        >
          {children}
        </ComponentToRender>
      </Box>
    )
  },
)

export const Rating = forwardRef<RatingProps, 'input'>(
  (
    {
      colorScheme = 'primary',
      defaultValue,
      name,
      numberOfRatings,
      onChange,
      variant,
      wrapComponentsPerRow = 5,
    },
    ref,
  ) => {
    const [currentValue, setCurrentValue] =
      useState<number | undefined>(defaultValue)

    // Call onChange everytime currentValue changes.
    useEffect(() => {
      onChange?.(currentValue)
    }, [currentValue, onChange])

    /**
     * Used to check whether a new row should be created when rendering rating
     * options.
     */
    const isSplitRows = useBreakpointValue({
      base: true,
      xs: true,
      sm: true,
      md: false,
    })

    // Generate options from maxRating given.
    const options = useMemo(
      () => Array.from({ length: numberOfRatings }, (_, i) => i + 1),
      [numberOfRatings],
    )

    return (
      <Wrap as="fieldset" spacing="-px">
        {options.map((value, i) => {
          return (
            <Fragment key={value}>
              <WrapItem>
                <RatingOption
                  name={name}
                  variant={variant}
                  colorScheme={colorScheme}
                  value={value}
                  numberOfRatings={numberOfRatings}
                  onChange={setCurrentValue}
                  selectedValue={currentValue}
                  // Pass in ref if first item so it can be focused.
                  {...(i === 0 ? { ref } : {})}
                >
                  {value}
                </RatingOption>
              </WrapItem>
              {
                // Force component to begin on a new line.
                value % wrapComponentsPerRow === 0 && isSplitRows && (
                  <Box flexBasis="100%" h="0.5rem" />
                )
              }
            </Fragment>
          )
        })}
      </Wrap>
    )
  },
)
