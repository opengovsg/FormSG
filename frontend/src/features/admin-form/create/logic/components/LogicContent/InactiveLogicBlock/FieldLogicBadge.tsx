import { useMemo } from 'react'
import { Box, Icon, Stack, Text, Tooltip } from '@chakra-ui/react'

import { BxsErrorCircle, BxsInfoCircle } from '~assets/icons'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { FormFieldWithQuestionNo } from '~features/form/types'

import { LogicBadge } from './LogicBadge'

interface FieldLogicBadgeProps {
  field?: FormFieldWithQuestionNo
  defaults?: {
    variant: 'error' | 'info'
    message: string
  }
}

/**
 * Field specific logic badge. Adds field icon and question number to the displayed badge.
 */
export const FieldLogicBadge = ({
  field,
  defaults = { variant: 'error', message: 'Field not found' },
}: FieldLogicBadgeProps) => {
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

  const tooltipLabel = useMemo(
    () => (!fieldMeta ? defaults.message : `${fieldMeta.label} field`),
    [fieldMeta, defaults.message],
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
    <LogicBadge display="inline-flex">
      <Stack direction="row" spacing="0.25rem" maxW="100%" align="center">
        <Tooltip placement="top" label={tooltipLabel} hasArrow>
          <Box display="inline-flex" alignItems="center">
            <Icon as={tooltipIcon} fontSize="1rem" color={textColor} />
          </Box>
        </Tooltip>
        {field ? (
          <>
            {field.questionNumber ? <Text>{field.questionNumber}.</Text> : null}
            <Text noOfLines={1}>{field.title}</Text>
          </>
        ) : (
          <Text textColor={textColor} noOfLines={1}>
            {defaults.message}
          </Text>
        )}
      </Stack>
    </LogicBadge>
  )
}
