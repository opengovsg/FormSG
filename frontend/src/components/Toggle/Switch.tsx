/**
 * Adapted from
 * https://github.com/chakra-ui/chakra-ui/blob/main/packages/switch/src/switch.tsx
 * so as to support inserting icons in the switch thumb (the circular part).
 */

import { useMemo } from 'react'
import { useCheckbox, UseCheckboxProps } from '@chakra-ui/checkbox'
import { Icon } from '@chakra-ui/react'
import {
  chakra,
  forwardRef,
  HTMLChakraProps,
  omitThemingProps,
  SystemProps,
  SystemStyleObject,
  ThemingProps,
  useMultiStyleConfig,
} from '@chakra-ui/system'
import { cx, dataAttr } from '@chakra-ui/utils'

import { BxCheck, BxLockAlt, BxX } from '~/assets/icons'
import { TOGGLE_THEME_KEY } from '~/theme/components/Toggle'

export interface SwitchProps
  extends Omit<UseCheckboxProps, 'isIndeterminate'>,
    Omit<HTMLChakraProps<'label'>, keyof UseCheckboxProps>,
    ThemingProps<'Switch'> {
  /**
   * The spacing between the switch and its label text
   * @default 0.5rem
   * @type SystemProps["marginLeft"]
   */
  spacing?: SystemProps['marginLeft']
  /**
   * Icon for disabled switch; defaults to lock-alt.
   */
  disabledIcon?: (props: React.SVGProps<SVGSVGElement>) => JSX.Element
  /**
   * Icon for checked switch; defaults to lock-alt.
   */
  checkedIcon?: (props: React.SVGProps<SVGSVGElement>) => JSX.Element
  /**
   * Icon for unchecked switch; defaults to lock-alt.
   */
  uncheckedIcon?: (props: React.SVGProps<SVGSVGElement>) => JSX.Element
}

export const Switch = forwardRef<SwitchProps, 'input'>(
  (
    {
      disabledIcon = BxLockAlt,
      checkedIcon = BxCheck,
      uncheckedIcon = BxX,
      ...props
    },
    ref,
  ) => {
    const styles = useMultiStyleConfig(TOGGLE_THEME_KEY, props)

    const {
      spacing = '0.5rem',
      children,
      ...ownProps
    } = omitThemingProps(props)

    const {
      state,
      getInputProps,
      getCheckboxProps,
      getRootProps,
      getLabelProps,
    } = useCheckbox(ownProps)

    const containerStyles: SystemStyleObject = useMemo(
      () => ({
        display: 'inline-block',
        verticalAlign: 'middle',
        lineHeight: 'normal',
        ...styles.container,
      }),
      [styles.container],
    )

    const trackStyles: SystemStyleObject = useMemo(
      () => ({
        display: 'inline-flex',
        flexShrink: 0,
        justifyContent: 'flex-start',
        boxSizing: 'content-box',
        cursor: 'pointer',
        ...styles.track,
      }),
      [styles.track],
    )

    const labelStyles: SystemStyleObject = useMemo(
      () => ({
        userSelect: 'none',
        marginStart: spacing,
        ...styles.label,
      }),
      [spacing, styles.label],
    )

    const ThumbIcon = state.isDisabled
      ? disabledIcon
      : state.isChecked
      ? checkedIcon
      : uncheckedIcon

    return (
      <chakra.label
        {...getRootProps()}
        className={cx('chakra-switch', props.className)}
        __css={containerStyles}
      >
        <input className="chakra-switch__input" {...getInputProps({}, ref)} />
        <chakra.span
          {...getCheckboxProps()}
          className="chakra-switch__track"
          __css={trackStyles}
        >
          <chakra.span
            __css={styles.thumb}
            className="chakra-switch__thumb"
            data-checked={dataAttr(state.isChecked)}
            data-hover={dataAttr(state.isHovered)}
          >
            {
              <Icon
                as={ThumbIcon}
                __css={styles.icon}
                data-checked={dataAttr(state.isChecked)}
              />
            }
          </chakra.span>
        </chakra.span>
        {children && (
          <chakra.span
            className="chakra-switch__label"
            {...getLabelProps()}
            __css={labelStyles}
          >
            {children}
          </chakra.span>
        )}
      </chakra.label>
    )
  },
)
