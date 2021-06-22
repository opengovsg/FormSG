import { HTMLProps, KeyboardEvent, useCallback, useMemo } from 'react'
import {
  Box,
  forwardRef,
  Icon,
  Text,
  useRadio,
  useToken,
  VisuallyHidden,
} from '@chakra-ui/react'

import { BxHeart, BxsHeart, BxsStar, BxStar } from '~assets/icons'
import { FieldColorScheme } from '~theme/foundations/colours'

interface BaseRatingComponent {
  /**
   * Radio styling props to spread on container.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checkbox: Omit<HTMLProps<any>, never>
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
  checkbox,
  inputId,
  value,
  selectedValue,
  colorScheme = 'primary',
}: BaseRatingComponent): JSX.Element => {
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

  const isChecked = value === (selectedValue ?? 0)

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
          _active: {
            color: 'white',
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
      <VisuallyHidden>
        {value} {isChecked ? 'selected' : 'unselected'}
      </VisuallyHidden>
      <Text aria-hidden>{value}</Text>
    </Box>
  )
}

const IconRating = ({
  checkbox,
  inputId,
  value,
  selectedValue,
  colorScheme = 'primary',
  emptyIcon,
  fullIcon,
}: IconRatingComponent): JSX.Element => {
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

  const isChecked = value <= (selectedValue ?? 0)

  return (
    <Box
      {...checkbox}
      as="label"
      htmlFor={inputId}
      aria-hidden={false}
      {...(isChecked ? { 'data-checked': '' } : {})}
      display="flex"
      p="0.125rem"
      borderRadius="0.25rem"
      color={themeColor}
      transitionProperty="common"
      transitionDuration="normal"
      cursor="pointer"
      _focus={{
        boxShadow: `0 0 0 2px ${themeColor}`,
      }}
      _hover={{
        color: `${colorScheme}.700`,
      }}
      _disabled={{
        borderColor: 'neutral.500',
        color: 'neutral.500',
        cursor: 'not-allowed',
        _active: {
          color: 'neutral.500',
        },
      }}
    >
      <VisuallyHidden>
        {value} {isChecked ? 'selected' : 'unselected'}
      </VisuallyHidden>
      <Icon as={isChecked ? fullIcon : emptyIcon} fontSize="2.5rem" />
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
  variant: 'Heart' | 'Star' | 'Number'
}

export const RatingOption = forwardRef<RatingOptionProps, 'input'>(
  (
    { colorScheme = 'primary', name, onChange, selectedValue, value, variant },
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

    const componentToRender = useMemo(() => {
      const props = {
        checkbox,
        value,
        selectedValue,
        colorScheme,
        inputId: input.id,
      }
      switch (variant) {
        case 'Number':
          return <NumberRating {...props} />
        case 'Heart':
          return (
            <IconRating {...props} emptyIcon={BxHeart} fullIcon={BxsHeart} />
          )
        case 'Star':
          return <IconRating {...props} emptyIcon={BxStar} fullIcon={BxsStar} />
      }
    }, [checkbox, colorScheme, input.id, selectedValue, value, variant])

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
        {componentToRender}
      </Box>
    )
  },
)
