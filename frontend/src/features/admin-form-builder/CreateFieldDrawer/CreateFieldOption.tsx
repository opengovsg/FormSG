import { useMemo } from 'react'
import {
  ButtonProps,
  chakra,
  forwardRef,
  Icon,
  Stack,
  Text,
} from '@chakra-ui/react'

import { BasicField } from '~shared/types/field'

import { FIELDS_TO_CREATE_META } from './constants'

interface FieldOptionProps extends ButtonProps {
  fieldType: BasicField
}

export const CreateFieldOption = forwardRef<FieldOptionProps, 'div'>(
  ({ fieldType, isDisabled, ...props }, ref) => {
    const meta = useMemo(() => FIELDS_TO_CREATE_META[fieldType], [fieldType])

    return (
      <chakra.button
        px="1.5rem"
        {...(isDisabled ? { 'data-disabled': true } : {})}
        _disabled={{
          opacity: 0.5,
          cursor: 'not-allowed',
          _hover: { bg: 'white' },
          _focus: { bg: 'white' },
        }}
        _hover={{ bg: 'primary.100' }}
        _focus={{ bg: 'primary.200' }}
        bg="white"
        ref={ref}
        {...props}
      >
        <Stack
          py="1rem"
          spacing="1.5rem"
          direction="row"
          align="center"
          color="secondary.500"
        >
          <Icon fontSize="1.5rem" as={meta.icon} />
          <Text textStyle="body-1">{meta.label}</Text>
        </Stack>
      </chakra.button>
    )
  },
)
