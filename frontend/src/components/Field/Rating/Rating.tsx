import { useCallback, useMemo, useState } from 'react'
import {
  forwardRef,
  Grid,
  HStack,
  Stack,
  Text,
  useBreakpointValue,
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

  /**
   * Whether the rating field is disabled.
   */
  isDisabled?: boolean
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
      isDisabled,
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

    // Generate options from maxRating given, grouped by display row.
    const options = useMemo(() => {
      const options = []
      let suboptions = []
      for (let i = 1; i <= numberOfRatings; i++) {
        suboptions.push(i)
        if (isSplitRows && i % wrapComponentsPerRow === 0) {
          options.push(suboptions)
          suboptions = []
        }
      }
      if (suboptions.length > 0) options.push(suboptions)
      return options
    }, [isSplitRows, numberOfRatings, wrapComponentsPerRow])

    const optionSpacing = useMemo(() => {
      switch (variant) {
        case 'number':
          return { column: '-1px', row: '0.5rem' }
        default:
          return { column: 0, row: 0 }
      }
    }, [variant])

    return (
      <Grid
        rowGap="0.5rem"
        templateAreas={{
          base: "'caption' 'rating'",
          md: "'rating' 'caption'",
        }}
      >
        <Stack
          gridArea="rating"
          as="fieldset"
          direction={{ base: 'column', md: 'row' }}
          spacing={{ base: '0.5rem', md: '1rem' }}
          align={{ base: 'flex-start', md: 'center' }}
        >
          <Stack spacing={optionSpacing.row}>
            {options.map((row, i) => (
              <HStack spacing={optionSpacing.column} key={i}>
                {row.map((value) => (
                  <RatingOption
                    name={name}
                    variant={variant}
                    colorScheme={colorScheme}
                    value={value}
                    onChange={handleRatingChange}
                    selectedValue={currentValue}
                    isDisabled={isDisabled}
                    key={value}
                    {...(value === 1 ? { ref } : {})}
                  >
                    {value}
                  </RatingOption>
                ))}
              </HStack>
            ))}
          </Stack>
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
