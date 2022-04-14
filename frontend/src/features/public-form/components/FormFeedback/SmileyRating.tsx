import {
  chakra,
  Flex,
  forwardRef,
  HStack,
  Icon,
  RadioProps,
  Stack,
  useRadio,
  useRadioGroup,
} from '@chakra-ui/react'

import { BxsAngry, BxsHappy, BxsMeh, BxsSad, BxsSmile } from '~assets/icons'

export interface SmileyRatingProps {
  name?: string
  value: number
  onChange: (newRating?: string) => void
}

const SMILEY_ICONS = [
  {
    icon: BxsAngry,
    color: 'danger.500',
    value: 1,
  },
  {
    icon: BxsSad,
    color: 'theme-orange.500',
    value: 2,
  },
  {
    icon: BxsMeh,
    color: 'warning.500',
    value: 3,
  },
  {
    icon: BxsSmile,
    color: 'primary.500',
    value: 4,
  },
  {
    icon: BxsHappy,
    color: 'success.500',
    value: 5,
  },
]

interface SmileyProps extends RadioProps {
  data: typeof SMILEY_ICONS[number]
}

const Smiley = forwardRef<SmileyProps, 'input'>(
  ({ data, ...radioProps }, ref) => {
    const { getInputProps, getCheckboxProps, htmlProps, getLabelProps } =
      useRadio(radioProps)

    return (
      <chakra.label {...getLabelProps()} {...htmlProps} cursor="pointer">
        <input {...getInputProps()} ref={ref} />
        <Flex
          align="center"
          justify="center"
          rounded="full"
          {...getCheckboxProps()}
          _focus={{ boxShadow: 'outline' }}
          _checked={{ boxShadow: `0 0 0 2px var(--chakra-colors-primary-500)` }}
        >
          <Icon as={data.icon} color={data.color} fontSize="3rem" />
        </Flex>
      </chakra.label>
    )
  },
)

export const SmileyRating = forwardRef<SmileyRatingProps, 'input'>(
  ({ name, value, onChange }, ref): JSX.Element => {
    const { getRadioProps, getRootProps } = useRadioGroup({
      isNative: true,
      onChange,
      value,
      name,
    })

    return (
      <Stack {...getRootProps()}>
        <HStack spacing={{ base: '0.5rem', md: '1rem' }}>
          {SMILEY_ICONS.map((icon, i) => {
            return (
              <Smiley
                key={icon.value}
                data={icon}
                {...getRadioProps({
                  value: icon.value,
                  isChecked: String(icon.value) === String(value),
                })}
                {...(i === 0 ? { ref } : {})}
              />
            )
          })}
        </HStack>
      </Stack>
    )
  },
)
