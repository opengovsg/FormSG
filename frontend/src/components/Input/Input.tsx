import { useMemo } from 'react'
import {
  forwardRef,
  Icon,
  Input as ChakraInput,
  InputGroup,
  InputLeftAddon,
  InputProps as ChakraInputProps,
  InputRightElement,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { omit } from '@chakra-ui/utils'
import { merge } from 'lodash'

import { BxsCheckCircle } from '~assets/icons/BxsCheckCircle'

import { BxLockAlt } from '../../assets/icons/BxLockAlt'

export interface InputProps extends ChakraInputProps {
  /**
   * Whether the input is in a prefilled state.
   */
  isPrefilled?: boolean
  /**
   * Whether the input is in a locked prefilled state.
   */
  isPrefillLocked?: boolean
  /**
   * Whether the input is in a success state.
   */
  isSuccess?: boolean
  /**
   * Whether to prevent default on user pressing the 'Enter' key.
   */
  preventDefaultOnEnter?: boolean
  /**
   * Whether there's an input right element. Used to provide additional padding
   */
  hasInputRightElement?: boolean
}

export const Input = forwardRef<InputProps, 'input'>((props, ref) => {
  const inputStyles = useMultiStyleConfig('Input', props)

  // Omit extra props so they will not be passed into the DOM and trigger
  // React warnings.
  const inputProps = omit(props, [
    'isSuccess',
    'isPrefilled',
    'isPrefillLocked',
    'preventDefaultOnEnter',
    'hasInputRightElement',
  ])

  const preventDefault = useMemo(
    () =>
      // This flag should be set for form input fields, to prevent refresh on enter if form only has one input
      props.preventDefaultOnEnter
        ? {
            onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            },
          }
        : {},
    [props.preventDefaultOnEnter],
  )

  // Return normal input component if not success state.
  if (!props.isSuccess) {
    if (props.prefix) {
      return (
        <InputGroup>
          <InputLeftAddon pointerEvents="none" children={props.prefix} />
          <ChakraInput
            ref={ref}
            {...preventDefault}
            {...inputProps}
            {...(props.isPrefillLocked ? { isDisabled: true } : {})}
            sx={props.sx ?? inputStyles.field}
          />
          {props.isPrefillLocked ? (
            <InputRightElement>
              <BxLockAlt />
            </InputRightElement>
          ) : null}
        </InputGroup>
      )
    } else {
      return props.isPrefillLocked ? (
        <InputGroup>
          <ChakraInput
            ref={ref}
            {...preventDefault}
            {...inputProps}
            isDisabled={true}
            // Padding to allow for lock icon overflow.
            sx={merge({ pr: '2.75rem' }, inputStyles.field, props.sx)}
          />
          <InputRightElement>
            <BxLockAlt />
          </InputRightElement>
        </InputGroup>
      ) : (
        <ChakraInput
          ref={ref}
          {...preventDefault}
          {...inputProps}
          sx={merge(
            props.hasInputRightElement ? { pr: '2.75rem' } : {},
            inputStyles.field,
            props.sx,
          )}
        />
      )
    }
  }

  return (
    // InputGroup is required for InputRightElement to retrieve the correct
    // style props. Will crash if not included.
    <InputGroup>
      <ChakraInput
        ref={ref}
        {...preventDefault}
        {...inputProps}
        sx={props.sx ?? inputStyles.field}
      />
      <InputRightElement sx={inputStyles.success}>
        <Icon as={BxsCheckCircle} />
      </InputRightElement>
    </InputGroup>
  )
})

/**
 * This is used in by Chakra's `InputGroup` component to remove border radii
 * when paired with `InputLeftAddon` or `InputRightAddon`.
 *
 * See https://github.com/chakra-ui/chakra-ui/blob/main/packages/input/src/input.tsx#L70 and
 * https://github.com/chakra-ui/chakra-ui/blob/main/packages/input/src/input-group.tsx#L58.
 */
Input.id = 'Input'
