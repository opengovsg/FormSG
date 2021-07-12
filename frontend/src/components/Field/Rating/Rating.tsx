import { Fragment, useCallback, useMemo, useState } from 'react'
import {
  Box,
  forwardRef,
  Grid,
  Stack,
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
  variant: 'heart' | 'star' | 'number'

  /**
   * Helper text to be displayed to quantify the ratings, if any.
   */
  helperText?: string
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
      helperText,
    },
    ref,
  ) => {
    /**
     * Process given defaultValue and prevents invalid numbers from being used.
     * @param val the number to process
     * @returns given value if value is in range [1, numberOfRatings], undefined otherwise.
     */
    const processDefaultValue = (val: number | undefined) => {
      if (!val || val > numberOfRatings || val < 1) {
        return undefined
      }
      return val
    }

    const [currentValue, setCurrentValue] = useState<number | undefined>(
      processDefaultValue(defaultValue),
    )

    const handleRatingChange = useCallback(
      (newRating?: number) => {
        setCurrentValue(newRating)
        onChange?.(newRating)
      },
      [onChange],
    )

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
        case 'number':
          return { spacing: '-1px', rowHeight: '0.5rem' }
        default:
          return { spacing: 0, rowHeight: 0 }
      }
    }, [variant])

    return (
      <Grid
        rowGap="0.5rem"
        templateAreas={[
          `'caption' 'rating'`,
          `'caption' 'rating'`,
          `'caption' 'rating'`,
          `'rating' 'caption'`,
        ]}
      >
        <Stack
          gridArea="rating"
          as="fieldset"
          direction={['column', 'column', 'column', 'row']}
          spacing={['0.5rem', '0.5rem', '0.5rem', '1rem']}
          align={['flex-start', 'flex-start', 'flex-start', 'center']}
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
                      onChange={handleRatingChange}
                      selectedValue={currentValue}
                      // Pass in ref if first item so it can be focused.
                      {...(i === 0 ? { ref } : {})}
                    >
                      {value}
                    </RatingOption>
                  </WrapItem>
                  {
                    // Force component to begin on a new line.
                    value !== numberOfRatings &&
                      value % wrapComponentsPerRow === 0 &&
                      isSplitRows && (
                        <WrapItem display="contents" aria-hidden>
                          <Box flexBasis="100%" h={ratingLayout.rowHeight} />
                        </WrapItem>
                      )
                  }
                </Fragment>
              )
            })}
          </Wrap>
          {currentValue && variant !== 'number' && (
            <Text color="secondary.700" textStyle="subhead-2">
              {currentValue} selected
            </Text>
          )}
        </Stack>
        {helperText && (
          <Text
            id={`${name}-caption`}
            gridArea="caption"
            textStyle="caption-1"
            color="secondary.500"
          >
            {helperText}
          </Text>
        )}
      </Grid>
    )
  },
)
