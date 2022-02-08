import { Icon, Stack, Text } from '@chakra-ui/react'

import Tooltip from '~components/Tooltip'

import {
  BASICFIELD_TO_ICON,
  BASICFIELD_TO_READABLE,
} from '~features/admin-form-builder/constants'

import { FormFieldWithQuestionNumber } from '../../../BuilderLogicContext'

import { LogicBadge } from './LogicBadge'

interface FieldLogicBadgeProps {
  field: FormFieldWithQuestionNumber
}

/**
 * Field specific logic badge. Adds field icon and question number to the displayed badge.
 */
export const FieldLogicBadge = ({ field }: FieldLogicBadgeProps) => {
  return (
    <LogicBadge display="inline-flex">
      <Stack direction="row" spacing="0.25rem" maxW="100%">
        <Tooltip
          placement="top"
          label={`${BASICFIELD_TO_READABLE[field.fieldType]} field`}
          wrapperStyles={{ display: 'flex' }}
        >
          <Icon as={BASICFIELD_TO_ICON[field.fieldType]} fontSize="1rem" />
        </Tooltip>
        <Text>{field.questionNumber}.</Text>
        <Text isTruncated>{field.title}</Text>
      </Stack>
    </LogicBadge>
  )
}
