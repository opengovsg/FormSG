import { useMemo } from 'react'
import { BiCheck, BiX } from 'react-icons/bi'
import {
  Box,
  Flex,
  forwardRef,
  HStack,
  Icon,
  useRadio,
  useRadioGroup,
  UseRadioGroupReturn,
  UseRadioProps,
  useToken,
} from '@chakra-ui/react'

export interface YesNoProps {
  onChange?: UseRadioGroupReturn['onChange']
  value?: 'yes' | 'no'
  name: string
}

interface YesNoOptionProps extends UseRadioProps {
  children: React.ReactNode
  order: 'left' | 'right'
}

const YesNoOption = forwardRef<YesNoOptionProps, 'input'>(
  ({ children, order, ...props }, ref) => {
    const { getInputProps, getCheckboxProps } = useRadio(props)
    const input = getInputProps({}, ref)

    const checkbox = getCheckboxProps({})
    const [neutral500, primary500] = useToken('colors', [
      'neutral.500',
      'primary.500',
    ])

    return (
      <Box as="label" w="100%" zIndex={props.isChecked ? 1 : 'initial'}>
        <input
          {...input}
          onClick={(e) => {
            if (props.isChecked && input.onChange) {
              // eslint-disable-next-line @typescript-eslint/no-extra-semi
              ;(input.onChange as UseRadioGroupReturn['onChange'])('')
            }
          }}
        />
        <Flex
          {...checkbox}
          aria-hidden={false}
          transitionProperty="common"
          transitionDuration="normal"
          cursor="pointer"
          textStyle="subhead-1"
          justify="center"
          bg="neutral.100"
          border={`1px solid ${neutral500}`}
          borderRadius={order === 'left' ? '4px 0 0 4px' : '0 4px 4px 0'}
          p="15px"
          _hover={{
            bg: 'primary.200',
          }}
          _active={{
            borderColor: 'primary.500',
            boxShadow: `0 0 0 2px ${primary500}`,
          }}
          _focus={{
            borderColor: 'primary.500',
            boxShadow: `0 0 0 1px ${primary500}`,
          }}
          _checked={{
            bg: 'primary.200',
            borderColor: 'primary.500',
            boxShadow: `0 0 0 2px ${primary500}`,
          }}
          align="center"
        >
          {children}
        </Flex>
      </Box>
    )
  },
)

export const YesNo = forwardRef<YesNoProps, 'input'>(
  ({ name, onChange, value }, ref) => {
    const { getRootProps, getRadioProps } = useRadioGroup({
      name,
      onChange,
      value,
    })

    const groupProps = getRootProps()
    const [noProps, yesProps] = useMemo(() => {
      return [
        getRadioProps({ value: 'no', enterKeyHint: '' }),
        getRadioProps({ value: 'yes', enterKeyHint: '' }),
      ]
    }, [getRadioProps])

    return (
      <HStack spacing="-px" {...groupProps} maxW="100%">
        {/* Ref is set here so any errors can focus this input */}
        <YesNoOption order="left" {...noProps} ref={ref}>
          <Icon
            display={['none', 'none', 'initial']}
            as={BiX}
            fontSize="1.5rem"
            mr="0.5rem"
            aria-hidden
          />
          No
        </YesNoOption>
        <YesNoOption order="right" {...yesProps}>
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
