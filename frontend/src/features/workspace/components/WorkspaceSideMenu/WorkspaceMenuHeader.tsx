import { BiPlus } from 'react-icons/bi'
import { Flex, FlexProps, Text } from '@chakra-ui/react'

import IconButton from '~components/IconButton'

export const WorkspaceMenuHeader = ({ ...props }: FlexProps): JSX.Element => (
  <Flex justifyContent="space-between" px="2rem" mt="1.5rem" {...props}>
    <Text textStyle="h4" color="secondary.700">
      Workspaces
    </Text>
    <IconButton
      size="sm"
      h="1.5rem"
      w="1.5rem"
      aria-label="Create new workspace"
      variant="clear"
      colorScheme="secondary"
      // TODO (hans): Implement add workspace modal view
      onClick={() => null}
      icon={<BiPlus />}
    />
  </Flex>
)
