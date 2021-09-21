import {
  Box,
  ComponentWithAs,
  CSSObject,
  Flex,
  forwardRef,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { TOGGLE_THEME_KEY } from '~/theme/components/Toggle'

import FormLabel from '../FormControl/FormLabel'

import { Switch, SwitchProps } from './Switch'

export interface ToggleProps extends SwitchProps {
  /**
   * Main label of the toggle
   */
  label: string
  /**
   * Secondary description text
   */
  description?: string
  /**
   * Overriding styles for the container which wraps the text
   * as well as the switch
   */
  containerStyles?: CSSObject
  /**
   * Overriding styles for the main label
   */
  labelStyles?: CSSObject
  /**
   * Overriding styles for the description
   */
  descriptionStyles?: CSSObject
}

type ToggleWithParts = ComponentWithAs<'input', ToggleProps> & {
  Switch: typeof Switch
}

export const Toggle = forwardRef<ToggleProps, 'input'>(
  (
    {
      label,
      description,
      containerStyles,
      labelStyles,
      descriptionStyles,
      ...props
    },
    ref,
  ) => {
    const styles = useMultiStyleConfig(TOGGLE_THEME_KEY, props)
    return (
      <Flex __css={{ ...styles.overallContainer, ...containerStyles }}>
        {(label || description) && (
          <Box __css={styles.textContainer}>
            <FormLabel.Label sx={{ ...styles.label, ...labelStyles }}>
              {label}
            </FormLabel.Label>
            {description && (
              <FormLabel.Description
                sx={{ ...styles.description, ...descriptionStyles }}
              >
                {description}
              </FormLabel.Description>
            )}
          </Box>
        )}
        <Switch {...props} aria-label={label} ref={ref} />
      </Flex>
    )
  },
) as ToggleWithParts

Toggle.Switch = Switch
