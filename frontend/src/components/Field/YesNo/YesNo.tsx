import { KeyboardEvent, useCallback, useMemo } from 'react'
import { BiCheck, BiX } from 'react-icons/bi'
import {
  Box,
  Flex,
  forwardRef,
  HStack,
  Icon,
  useRadio,
  useRadioGroup,
  UseRadioGroupProps,
  UseRadioGroupReturn,
  UseRadioProps,
  useToken,
} from '@chakra-ui/react'

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
}

interface YesNoOptionProps extends UseRadioProps {
  children: React.ReactNode
  order: 'left' | 'right'
}

const YesNoOption = forwardRef<YesNoOptionProps, 'input'>(
  ({ children, order, ...props }, ref) => {
    const { getInputProps, getCheckboxProps } = useRadio({
      ...props,
      isDisabled: props.disabled,
    })
    const input = getInputProps({}, ref)

    const checkbox = getCheckboxProps({})
    const [neutral500, primary500] = useToken('colors', [
      'neutral.500',
      'primary.500',
    ])

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
          _disabled={{
            bg: 'neutral.200',
            cursor: 'not-allowed',
            color: 'neutral.500',
            _active: {
              boxShadow: 'none',
              borderColor: 'neutral.500',
            },
            _hover: {
              bg: 'neutral.200',
            },
            _checked: {
              bg: 'neutral.300',
              boxShadow: `0 0 0 2px ${neutral500}`,
              borderColor: 'neutral.500',
              _hover: {
                bg: 'neutral.300',
              },
              _active: {
                borderColor: 'neutral.500',
              },
            },
          }}
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
  ({ isDisabled, ...props }, ref) => {
    const { getRootProps, getRadioProps } = useRadioGroup(props)

    const groupProps = getRootProps()
    const [noProps, yesProps] = useMemo(() => {
      return [
        getRadioProps({ value: 'no', enterKeyHint: '', disabled: isDisabled }),
        getRadioProps({ value: 'yes', enterKeyHint: '', disabled: isDisabled }),
      ]
    }, [getRadioProps, isDisabled])

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
