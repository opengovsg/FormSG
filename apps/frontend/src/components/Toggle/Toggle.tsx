import { useTranslation } from 'react-i18next'
import {
  Badge,
  Box,
  ComponentWithAs,
  CSSObject,
  Flex,
  forwardRef,
  Icon,
  Text,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { TOGGLE_THEME_KEY } from '~/theme/components/Toggle'

import { BxsHelpCircle } from '~assets/icons/BxsHelpCircle'
import { BxsInfoCircle } from '~assets/icons/BxsInfoCircle'
import Tooltip from '~components/Tooltip'
import { TooltipProps } from '~components/Tooltip/Tooltip'

import FormLabel from '../FormControl/FormLabel'

import { Switch, SwitchProps } from './Switch'

export interface ToggleProps extends Omit<SwitchProps, 'children'> {
  /**
   * Main label of the toggle
   */
  label: string
  /**
   * Whether to show a beta chip to the left of the label.
   * @default false
   */
  betaBadge?: boolean
  /**
   * Secondary description text
   */
  description?: string
  /**
   * Tooltip text to be postfixed at the end of each label, if any.
   */
  tooltipText?: string
  /**
   * Tooltip placement for the tooltip text, if any.
   */
  tooltipPlacement?: TooltipProps['placement']
  /**
   * Determines Tooltip icon used for the tooltip text. Defaults to help.
   */
  tooltipVariant?: 'info' | 'help'
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

const BetaBadge = () => {
  const { t } = useTranslation()
  return (
    <Badge
      colorScheme="primary"
      variant="subtle"
      color="secondary.500"
      borderRadius="full"
      mr="0.5rem"
      flexShrink={0}
    >
      {t('features.common.betaBadgeLabel')}
    </Badge>
  )
}

export const Toggle = forwardRef<ToggleProps, 'input'>(
  (
    {
      label,
      betaBadge = false,
      description,
      containerStyles,
      labelStyles,
      descriptionStyles,
      tooltipText,
      tooltipPlacement,
      tooltipVariant,
      ...props
    },
    ref,
  ) => {
    const styles = useMultiStyleConfig(TOGGLE_THEME_KEY, props)
    return (
      <Flex __css={{ ...styles.overallContainer, ...containerStyles }}>
        {(label || description) && (
          <Box __css={styles.textContainer}>
            <Flex alignItems="center">
              {betaBadge ? <BetaBadge /> : null}
              <FormLabel.Label sx={{ ...styles.label, ...labelStyles }}>
                <Text>{label}</Text>
              </FormLabel.Label>
              {tooltipText && (
                <Tooltip
                  placement={tooltipPlacement}
                  label={tooltipText}
                  aria-label={`Tooltip content: ${tooltipText}`}
                >
                  <Icon
                    ml="0.5rem"
                    mt="0.1rem"
                    color="secondary.500"
                    as={
                      tooltipVariant === 'info' ? BxsInfoCircle : BxsHelpCircle
                    }
                    verticalAlign="middle"
                  />
                </Tooltip>
              )}
            </Flex>
            {description && (
              <FormLabel.Description
                useMarkdown
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
