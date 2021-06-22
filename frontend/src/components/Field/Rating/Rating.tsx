import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  Box,
  forwardRef,
  Text,
  useBreakpointValue,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'

import { FieldColorScheme } from '~theme/foundations/colours'

import { RatingOption } from './RatingOption'

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

    const ratingLayout = useMemo(() => {
      switch (variant) {
        case 'Number':
          return { spacing: '-px', rowHeight: '0.5rem' }
        default:
          return { spacing: '0.25rem', rowHeight: 0 }
      }
    }, [variant])

    return (
      <Wrap
        as="fieldset"
        align="center"
        shouldWrapChildren
        spacing={['0.5rem', '0.5rem', '1rem']}
      >
        <Wrap spacing={ratingLayout.spacing}>
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
                    <Box flexBasis="100%" h={ratingLayout.rowHeight} />
                  )
                }
              </Fragment>
            )
          })}
        </Wrap>
        {currentValue && variant !== 'Number' && (
          <Text textStyle="subhead-2">{currentValue} selected</Text>
        )}
      </Wrap>
    )
  },
)
