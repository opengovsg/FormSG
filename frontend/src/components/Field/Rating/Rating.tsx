import { Fragment, KeyboardEvent, useCallback, useMemo, useState } from 'react'
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

export interface RatingProps {
  name: string
  numberOfRatings: number
  colorScheme?: FieldColorScheme
  onChange?: (newRating: number | undefined) => void

  /**
   * Number of rating components to show per row when unable to display all
   * components on a single line. Defaults to `5`.
   */
  wrapComponentsPerRow?: number

  initialValue?: number
}

interface RatingOptionProps {
  /**
   * Color scheme of the component to render. Defaults to `primary`.
   */
  colorScheme?: FieldColorScheme
  value: number
  onChange?: (newRating: number | undefined) => void
  selectedValue?: number
  name: string
}

const NumericalRatingOption = forwardRef<RatingOptionProps, 'div'>(
  (
    { colorScheme = 'primary', value, onChange, selectedValue, name, children },
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
      <Box _active={{ zIndex: 1 }} _focusWithin={{ zIndex: 1 }}>
        <input
          type="radio"
          aria-checked={selectedValue === value}
          {...input}
          onChange={handleSelect}
          onKeyDown={handleSpacebar}
          ref={ref}
        />
        <Box
          as="label"
          htmlFor={input.id}
          {...checkbox}
          aria-hidden={false}
          {...(selectedValue === value ? { 'data-checked': '' } : {})}
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
      </Box>
    )
  },
)

export const Rating = forwardRef<RatingProps, 'input'>(
  (
    {
      numberOfRatings,
      colorScheme = 'primary',
      onChange,
      wrapComponentsPerRow = 5,
      name,
      initialValue,
    },
    ref,
  ) => {
    const [currentValue, setCurrentValue] =
      useState<number | undefined>(initialValue)

    /**
     * Used to force a breakpoint to new row on smaller screens.
     * Unable to separate components due to weird behaviour when selecting or
     * deselecting options.
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

    const updateCurrentValue = useCallback(
      (value: number | undefined) => {
        setCurrentValue(value)
        onChange?.(value)
      },
      [onChange],
    )

    return (
      <Wrap as="fieldset" spacing="-px">
        {options.map((value, i) => {
          return (
            <Fragment key={value}>
              <WrapItem>
                <NumericalRatingOption
                  name={name}
                  colorScheme={colorScheme}
                  value={value}
                  numberOfRatings={numberOfRatings}
                  onChange={updateCurrentValue}
                  selectedValue={currentValue}
                  {...(i === 0 ? { ref } : {})}
                >
                  {value}
                </NumericalRatingOption>
              </WrapItem>
              {value % wrapComponentsPerRow === 0 && isSplitRows && (
                <Box flexBasis="100%" h="0.5rem" />
              )}
            </Fragment>
          )
        })}
      </Wrap>
    )
  },
)
