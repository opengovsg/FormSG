import { useMemo } from 'react'
import { Icon, Stack, Text } from '@chakra-ui/react'

import { BxsErrorCircle, BxsInfoCircle } from '~assets/icons'
import Tooltip from '~components/Tooltip'

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

  const tooltipLabel = useMemo(
    () => (!fieldMeta ? defaults.message : `${fieldMeta.label} field`),
    [fieldMeta, defaults.message],
  )

  const errorIcon = useMemo(() => {
    switch (defaults.variant) {
      case 'error':
        return <Icon as={BxsErrorCircle} fontSize="1rem" color="danger.500" />
      case 'info':
        return <Icon as={BxsInfoCircle} fontSize="1rem" color="primary.500" />
    }
  }, [defaults.variant])

  const errorText = useMemo(() => {
    switch (defaults.variant) {
      case 'error':
        return (
          <Text textColor="danger.500" noOfLines={1}>
            {defaults.message}
          </Text>
        )
      case 'info':
        return (
          <Text textColor="primary.500" noOfLines={1}>
            {defaults.message}
          </Text>
        )
    }
  }, [defaults])

  return (
    <LogicBadge display="inline-flex">
      <Stack direction="row" spacing="0.25rem" maxW="100%">
        <Tooltip
          placement="top"
          label={tooltipLabel}
          wrapperStyles={{ display: 'flex' }}
        >
          {fieldMeta ? <Icon as={fieldMeta.icon} fontSize="1rem" /> : errorIcon}
        </Tooltip>
        {field ? (
          <>
            {field.questionNumber ? <Text>{field.questionNumber}.</Text> : null}
            <Text noOfLines={1}>{field.title}</Text>
          </>
        ) : (
          errorText
        )}
      </Stack>
    </LogicBadge>
  )
}
