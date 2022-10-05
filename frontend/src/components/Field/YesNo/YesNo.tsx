import { useMemo } from 'react'
import { BiCheck, BiX } from 'react-icons/bi'
import {
  forwardRef,
  HStack,
  useFormControlProps,
  useRadioGroup,
} from '@chakra-ui/react'
import pick from 'lodash/pick'

import { FieldColorScheme } from '~theme/foundations/colours'

import { YesNoOption } from './YesNoOption'

export type YesNoOptionValue = 'Yes' | 'No'

export interface YesNoProps {
  /**
   * Whether YesNo component is disabled.
   */
  isDisabled?: boolean
  /**
   * Function called once a radio is checked
   * @param nextValue the value of the checked radio
   */
  onChange?: (nextValue: YesNoOptionValue) => void
  /**
   * The value of the radio to be `checked`
   * (in controlled mode)
   */
  value?: YesNoOptionValue
  /**
   * The value of the radio to be `checked`
   * initially (in uncontrolled mode)
   */
  defaultValue?: YesNoOptionValue
  /**
   * The `name` attribute forwarded to each `radio` element
   */
  name: string

  /**
   * Color scheme of the component to render. Defaults to `primary`.
   */
  colorScheme?: FieldColorScheme
}

/**
 * YesNo field component.
 */
export const YesNo = forwardRef<YesNoProps, 'input'>(
  ({ colorScheme, ...props }, ref) => {
    const formControlProps = useFormControlProps(props)
    const { getRootProps, getRadioProps } = useRadioGroup(props)

    const groupProps = getRootProps()
    const [noProps, yesProps] = useMemo(() => {
      const baseProps = {
        ...pick(formControlProps, [
          'isDisabled',
          'isReadOnly',
          'isRequired',
          'isInvalid',
        ]),
        name: props.name,
      }

      return [
        getRadioProps({
          value: 'No',
          ...baseProps,
        }),
        getRadioProps({
          value: 'Yes',
          ...baseProps,
        }),
      ]
    }, [formControlProps, getRadioProps, props.name])

    return (
      // -1px so borders collapse.
      <HStack spacing="-1px" {...groupProps}>
        <YesNoOption
          side="left"
          colorScheme={colorScheme}
          {...noProps}
          leftIcon={BiX}
          label="No"
          // Ref is set here for tracking current value, and also so any errors
          // can focus this input.
          ref={ref}
        />
        <YesNoOption
          side="right"
          colorScheme={colorScheme}
          {...yesProps}
          leftIcon={BiCheck}
          label="Yes"
        />
      </HStack>
    )
  },
)
