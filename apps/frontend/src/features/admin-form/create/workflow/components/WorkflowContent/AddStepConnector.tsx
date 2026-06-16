import { BiPlus } from 'react-icons/bi'
import { Box, Divider, Flex, Icon } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'

interface AddStepConnectorProps {
  onClick: () => void
}

export const AddStepConnector = ({
  onClick,
}: AddStepConnectorProps): JSX.Element => {
  return (
    <Box alignSelf="center" justifyContent="center" border="none">
      <Divider
        orientation="vertical"
        h="1rem"
        borderLeftWidth="2px"
        marginLeft="7px"
        borderColor="secondary.200"
      />
      <Box position="relative" display="inline-block">
        <BxsChevronDown />
        <Flex
          as="button"
          type="button"
          onClick={onClick}
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          w="1.5rem"
          h="1.5rem"
          borderRadius="full"
          bg="primary.500"
          color="white"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          opacity={0.4}
          _hover={{
            opacity: 1,
            transform: 'translate(-50%, -50%) scale(1.15)',
          }}
          transition="opacity 0.15s ease, transform 0.15s ease"
          aria-label="Insert step"
          zIndex={1}
        >
          <Icon as={BiPlus} boxSize="0.875rem" />
        </Flex>
      </Box>
      <Divider
        orientation="vertical"
        h="1rem"
        borderLeftWidth="2px"
        marginLeft="7px"
        borderColor="secondary.200"
      />
    </Box>
  )
}
