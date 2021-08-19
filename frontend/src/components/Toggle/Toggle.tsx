import {
  Box,
  ComponentWithAs,
  CSSObject,
  Flex,
  forwardRef,
  SwitchProps as ChakraSwitchProps,
  useMultiStyleConfig,
  VisuallyHidden,
} from '@chakra-ui/react'

import { TOGGLE_THEME_KEY } from '~/theme/components/Toggle'

import FormLabel from '../FormControl/FormLabel'

import { Switch } from './Switch'

export interface ToggleProps extends ChakraSwitchProps {
  /**
   * Main label of the toggle
   */
  label?: string
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
      <Flex __css={styles.overallContainer}>
        {(label || description) && (
          <Box __css={{ ...styles.textContainer, ...containerStyles }}>
            {label && (
              <FormLabel.Label
                sx={{ ...styles.label, ...labelStyles }}
                // htmlFor={props.name}
              >
                {label}
              </FormLabel.Label>
            )}
            {description && (
              <FormLabel.Description
                sx={{ ...styles.description, ...descriptionStyles }}
              >
                {description}
              </FormLabel.Description>
            )}
          </Box>
        )}
        <Switch {...props} ref={ref}>
          {/* a11y - ensure label and description are linked to toggle */}
          <VisuallyHidden>{`${label}. Description: ${description}`}</VisuallyHidden>
        </Switch>
      </Flex>
    )
  },
) as ToggleWithParts

Toggle.Switch = Switch
