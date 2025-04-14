import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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

  /**
   * Better visibility of values in the disabled component when set to true.
   */
  highContrast?: boolean
}

/**
 * YesNo field component.
 */
export const YesNo = forwardRef<YesNoProps, 'input'>(
  ({ colorScheme, ...props }, ref) => {
    const formControlProps = useFormControlProps(props)
    const { getRootProps, getRadioProps, onChange } = useRadioGroup(props)
    const { t } = useTranslation()

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

      const noRadioProps = getRadioProps({
        value: 'No',
        ...baseProps,
      })

      const yesRadioProps = getRadioProps({
        value: 'Yes',
        ...baseProps,
      })

      return [noRadioProps, yesRadioProps]
    }, [formControlProps, getRadioProps, props.name])

    return (
      <HStack spacing={0} {...groupProps}>
        <YesNoOption
          side="left"
          colorScheme={colorScheme}
          {...noProps}
          onChange={(value) => onChange(value as YesNoOptionValue)}
          leftIcon={BiX}
          label={t('features.publicForm.components.fields.yesNo.no')}
          // Ref is set here for tracking current value, and also so any errors
          // can focus this input.
          ref={ref}
          title={props.title}
          highContrast={props.highContrast}
        />
        <YesNoOption
          side="right"
          colorScheme={colorScheme}
          {...yesProps}
          onChange={(value) => onChange(value as YesNoOptionValue)}
          leftIcon={BiCheck}
          label={t('features.publicForm.components.fields.yesNo.yes')}
          title={props.title}
          highContrast={props.highContrast}
        />
      </HStack>
    )
  },
)
