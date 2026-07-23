import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Icon, Stack, Text } from '@chakra-ui/react'

import { BxsErrorCircle, BxsInfoCircle } from '~assets/icons'
import Tooltip from '~components/Tooltip'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { FormFieldWithQuestionNo } from '~features/form/types'

import { getLogicFieldLabel } from '../utils/getLogicFieldLabel'

import { LogicBadge } from './LogicBadge'

interface FieldLogicBadgeProps {
  field?: FormFieldWithQuestionNo
  defaults?: {
    variant: 'error' | 'info'
    message?: string
  }
}

/**
 * Field specific logic badge. Adds field icon and question number to the displayed badge.
 */
export const FieldLogicBadge = ({
  field,
  defaults = {
    variant: 'error',
  },
}: FieldLogicBadgeProps) => {
  const { t } = useTranslation()

  const message = useMemo(
    () =>
      defaults.message ??
      t('features.adminForm.sidebar.logic.errors.fieldDeleted'),
    [defaults.message, t],
  )

  const fieldMeta = useMemo(
    () => (field ? BASICFIELD_TO_DRAWER_META[field.fieldType] : null),
    [field],
  )

  const textColor = useMemo(() => {
    if (fieldMeta) return undefined
    switch (defaults.variant) {
      case 'error':
        return 'danger.500'
      case 'info':
        return 'primary.500'
    }
  }, [defaults.variant, fieldMeta])

  const badgeColorScheme = useMemo(() => {
    if (fieldMeta) return undefined
    if (defaults.variant === 'error') {
      return 'danger'
    }
    return undefined
  }, [defaults.variant, fieldMeta])

  const tooltipLabel = useMemo(
    () =>
      !fieldMeta
        ? message
        : t('features.adminForm.sidebar.logic.fieldBadge.fieldLabel', {
            label: fieldMeta.label,
          }),
    [fieldMeta, message, t],
  )

  const tooltipIcon = useMemo(() => {
    if (fieldMeta) return fieldMeta.icon
    switch (defaults.variant) {
      case 'error':
        return BxsErrorCircle
      case 'info':
        return BxsInfoCircle
    }
  }, [defaults.variant, fieldMeta])

  return (
    <LogicBadge display="inline-flex" colorScheme={badgeColorScheme}>
      <Stack direction="row" spacing="0.25rem" maxW="100%" align="center">
        <Tooltip placement="top" label={tooltipLabel}>
          <Box display="inline-flex" alignItems="center">
            <Icon as={tooltipIcon} fontSize="1rem" color={textColor} />
          </Box>
        </Tooltip>
        {field ? (
          <Text noOfLines={1}>{getLogicFieldLabel(field)}</Text>
        ) : (
          <Text textColor={textColor} noOfLines={1}>
            {message}
          </Text>
        )}
      </Stack>
    </LogicBadge>
  )
}
