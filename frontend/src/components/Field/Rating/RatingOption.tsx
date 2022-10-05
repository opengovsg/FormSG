import { HTMLProps, KeyboardEvent, useCallback, useMemo } from 'react'
import {
  Box,
  forwardRef,
  Icon,
  useMultiStyleConfig,
  useRadio,
} from '@chakra-ui/react'

import { BxHeart, BxsHeart, BxsStar, BxStar } from '~assets/icons'
import { RATING_THEME_KEY } from '~theme/components/Field/Rating'
import { FieldColorScheme } from '~theme/foundations/colours'

interface BaseRatingComponent {
  /**
   * Radio styling props to spread on container.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  radioProps: Omit<HTMLProps<any>, never>
  /**
   * Value of the option.
   */
  value: number
  /**
   * The current selected value in the rating group.
   */
  selectedValue?: number
  /**
   * ID of the input this component is rendering for.
   */
  inputId: string | undefined
  /**
   * Color scheme of the component to render. Defaults to `primary`.
   */
  colorScheme?: FieldColorScheme
}

interface IconRatingComponent extends BaseRatingComponent {
  emptyIcon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element
  fullIcon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element
}

const NumberRating = ({
  radioProps,
  inputId,
  value,
  selectedValue,
  colorScheme = 'primary',
}: BaseRatingComponent): JSX.Element => {
  const styles = useMultiStyleConfig(RATING_THEME_KEY, {
    colorScheme,
    variant: 'number',
  })

  const isChecked = value === (selectedValue ?? 0)

  return (
    <Box
      {...radioProps}
      as="label"
      htmlFor={inputId}
      {...(isChecked ? { 'data-checked': '' } : {})}
      __css={styles.option}
    >
      {value}
    </Box>
  )
}

const IconRating = ({
  radioProps,
  inputId,
  value,
  selectedValue,
  colorScheme = 'primary',
  emptyIcon,
  fullIcon,
}: IconRatingComponent): JSX.Element => {
  const styles = useMultiStyleConfig(RATING_THEME_KEY, {
    colorScheme,
    variant: 'icon',
  })

  const isChecked = value <= (selectedValue ?? 0)

  return (
    <Box
      {...radioProps}
      as="label"
      htmlFor={inputId}
      aria-label={`${value}`}
      {...(isChecked ? { 'data-checked': '' } : {})}
      __css={styles.option}
    >
      <Icon
        as={isChecked ? fullIcon : emptyIcon}
        fontSize="2.5rem"
        aria-hidden
      />
    </Box>
  )
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
  variant: 'heart' | 'star' | 'number'
  /**
   * Whether radio option is disabled
   */
  isDisabled?: boolean
}

export const RatingOption = forwardRef<RatingOptionProps, 'input'>(
  (
    {
      colorScheme = 'primary',
      name,
      onChange,
      selectedValue,
      value,
      variant,
      isDisabled,
    },
    ref,
  ) => {
    const handleSelect = useCallback(() => {
      // Deselect if current value is re-selected value.
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
      isDisabled,
    })

    const inputProps = getInputProps()
    const radioProps = getCheckboxProps()

    const componentToRender = useMemo(() => {
      const props = {
        radioProps,
        value,
        selectedValue,
        colorScheme,
        inputId: inputProps.id,
      }
      switch (variant) {
        case 'number':
          return <NumberRating {...props} />
        case 'heart':
          return (
            <IconRating {...props} emptyIcon={BxHeart} fullIcon={BxsHeart} />
          )
        case 'star':
          return <IconRating {...props} emptyIcon={BxStar} fullIcon={BxsStar} />
      }
    }, [radioProps, colorScheme, inputProps.id, selectedValue, value, variant])

    return (
      <Box _active={{ zIndex: 1 }} _focusWithin={{ zIndex: 1 }}>
        <input
          type="radio"
          aria-checked={selectedValue === value}
          {...inputProps}
          data-testid={inputProps.id}
          onChange={handleSelect}
          onKeyDown={handleSpacebar}
          ref={ref}
        />
        {componentToRender}
      </Box>
    )
  },
)
