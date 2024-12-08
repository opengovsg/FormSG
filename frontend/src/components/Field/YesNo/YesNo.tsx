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

import { Language } from '~shared/types'

import { FieldColorScheme } from '~theme/foundations/colours'

import { YesNoOption } from './YesNoOption'

export type YesNoOptionValue = 'Yes' | 'No'

// TODO: port to i18next
type YesNoTranslations = {
  Yes: string
  No: string
}

const yesNoTranslations: Record<Language, YesNoTranslations> = {
  [Language.ENGLISH]: { Yes: 'Yes', No: 'No' },
  [Language.CHINESE]: { Yes: '是', No: '否' },
  [Language.MALAY]: { Yes: 'Ya', No: 'Tidak' },
  [Language.TAMIL]: { Yes: 'ஆம்', No: 'இல்லை' },
}

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

  selectedLanguage?: Language
}

/**
 * YesNo field component.
 */
export const YesNo = forwardRef<YesNoProps, 'input'>(
  ({ colorScheme, selectedLanguage = Language.ENGLISH, ...props }, ref) => {
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

    const yesLabel = yesNoTranslations[selectedLanguage].Yes
    const noLabel = yesNoTranslations[selectedLanguage].No

    return (
      <HStack spacing={0} {...groupProps}>
        <YesNoOption
          side="left"
          colorScheme={colorScheme}
          {...noProps}
          onChange={(value) => onChange(value as YesNoOptionValue)}
          leftIcon={BiX}
          label={yesLabel ?? t('features.adminForm.sidebar.fields.yesNo.no')}
          // Ref is set here for tracking current value, and also so any errors
          // can focus this input.
          ref={ref}
          title={props.title}
        />
        <YesNoOption
          side="right"
          colorScheme={colorScheme}
          {...yesProps}
          onChange={(value) => onChange(value as YesNoOptionValue)}
          leftIcon={BiCheck}
          label={noLabel ?? t('features.adminForm.sidebar.fields.yesNo.yes')}
          title={props.title}
        />
      </HStack>
    )
  },
)
