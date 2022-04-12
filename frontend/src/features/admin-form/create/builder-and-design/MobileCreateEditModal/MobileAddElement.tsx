import { useMemo } from 'react'
import { forwardRef, Icon, Stack, StackProps, Text } from '@chakra-ui/react'

import { BasicField } from '~shared/types/field'

import { BASICFIELD_TO_DRAWER_META } from '../../constants'

interface MobileAddElementProps extends StackProps {
  fieldType: BasicField
}

export const MobileAddElement = forwardRef<MobileAddElementProps, 'button'>(
  ({ fieldType, ...props }, ref) => {
    const meta = useMemo(
      () => BASICFIELD_TO_DRAWER_META[fieldType],
      [fieldType],
    )
    return (
      <Stack
        ref={ref}
        {...props}
        color="secondary.500"
        as="button"
        textAlign={'left'}
      >
        <Icon fontSize="1.5rem" as={meta.icon} />
        <Text textStyle="subhead-2">{meta.label}</Text>
      </Stack>
    )
  },
)
