import { BiDuplicate, BiGridHorizontal, BiTrash } from 'react-icons/bi'
import { Box, ButtonGroup, Collapse, Flex, Icon } from '@chakra-ui/react'

import { FormFieldDto } from '~shared/types/field'

import IconButton from '~components/IconButton'

export interface FieldRowContainerProps {
  isActive: boolean
  field: FormFieldDto
}

export const FieldRowContainer = ({
  isActive,
  field,
}: FieldRowContainerProps): JSX.Element => {
  return (
    <Flex
      transitionDuration="normal"
      bg="white"
      _hover={{ bg: 'secondary.100' }}
      borderRadius="4px"
      {...(isActive ? { 'data-active': true } : {})}
      _focusWithin={{
        boxShadow: '0 0 0 2px var(--chakra-colors-primary-500)',
      }}
      _active={{
        bg: 'secondary.100',
        boxShadow: '0 0 0 2px var(--chakra-colors-primary-500)',
      }}
      flexDir="column"
      align="center"
    >
      <Icon
        as={BiGridHorizontal}
        color="secondary.200"
        fontSize="1.5rem"
        cursor="grab"
        transition="color 0.2s ease"
        _hover={{
          color: 'secondary.300',
        }}
      />
      <Box p="1.5rem" pt={0} w="100%">
        TODO: Add field row for {field.fieldType}
      </Box>
      <Collapse in={isActive} style={{ width: '100%' }}>
        <Flex
          px="1.5rem"
          flex={1}
          borderTop="1px solid var(--chakra-colors-neutral-300)"
          justify="end"
        >
          <ButtonGroup variant="clear" colorScheme="secondary" spacing={0}>
            <IconButton
              aria-label="Duplicate field"
              icon={<BiDuplicate fontSize="1.25rem" />}
            />
            <IconButton
              colorScheme="danger"
              aria-label="Delete field"
              icon={<BiTrash fontSize="1.25rem" />}
            />
          </ButtonGroup>
        </Flex>
      </Collapse>
    </Flex>
  )
}
