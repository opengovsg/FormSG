import { useMemo } from 'react'
import { Icon, Stack, Text } from '@chakra-ui/react'

import { BxsErrorCircle, BxsInfoCircle } from '~assets/icons'
import Tooltip from '~components/Tooltip'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { FormFieldWithQuestionNo } from '~features/form/types'

import { LogicBadge } from './LogicBadge'

interface FieldLogicBadgeProps {
  field: FormFieldWithQuestionNo | null
  errorType?: 'error' | 'info'
  errorString?: string
}

/**
 * Field specific logic badge. Adds field icon and question number to the displayed badge.
 */
export const FieldLogicBadge = ({
  field,
  errorType = 'error',
  errorString = 'Field not found',
}: FieldLogicBadgeProps) => {
  const fieldMeta = useMemo(
    () => (field ? BASICFIELD_TO_DRAWER_META[field.fieldType] : null),
    [field],
  )

  const tooltipLabel = useMemo(
    () => (!fieldMeta ? errorString : `${fieldMeta.label} field`),
    [fieldMeta, errorString],
  )

  const errorIcon = useMemo(() => {
    switch (errorType) {
      case 'error':
        return <Icon as={BxsErrorCircle} fontSize="1rem" color="danger.500" />
      case 'info':
        return <Icon as={BxsInfoCircle} fontSize="1rem" color="primary.500" />
    }
  }, [errorType])

  const errorText = useMemo(() => {
    switch (errorType) {
      case 'error':
        return (
          <Text textColor="danger.500" noOfLines={1}>
            {errorString}
          </Text>
        )
      case 'info':
        return (
          <Text textColor="primary.500" noOfLines={1}>
            {errorString}
          </Text>
        )
    }
  }, [errorType, errorString])

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
