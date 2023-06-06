import { BiMenuAltLeft, BiPlus } from 'react-icons/bi'
import { Flex, FlexProps, Text, useDisclosure } from '@chakra-ui/react'

import IconButton from '~components/IconButton'

import { CreateWorkspaceModal } from '../WorkspaceModals/CreateWorkspaceModal'

interface WorkspaceMenuHeaderProps extends FlexProps {
  onMenuClick?: () => void
  shouldShowAddWorkspaceButton?: boolean
  shouldShowMenuIcon?: boolean
}

export const WorkspaceMenuHeader = ({
  shouldShowAddWorkspaceButton = false,
  shouldShowMenuIcon = false,
  onMenuClick,
  ...props
}: WorkspaceMenuHeaderProps): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: false })
  return (
    <Flex
      justifyContent={{ base: 'inherit', md: 'space-between' }}
      px={{ base: '1.5rem', md: '2rem' }}
      mt={{ base: 0, lg: '1rem' }}
      {...props}
      alignItems="center"
    >
      <CreateWorkspaceModal isOpen={isOpen} onClose={onClose} />
      <Flex alignItems="center">
        {shouldShowMenuIcon && (
          <IconButton
            icon={<BiMenuAltLeft />}
            onClick={() => onMenuClick && onMenuClick()}
            aria-label="open workspace drawer"
            variant="clear"
            colorScheme="primary"
            color="secondary.500"
          />
        )}
        <Text textStyle="h4" color="secondary.700">
          Workspaces
        </Text>
      </Flex>

      {shouldShowAddWorkspaceButton && (
        <IconButton
          size="lg"
          aria-label="Create new workspace"
          variant="clear"
          colorScheme="primary"
          color="secondary.500"
          // TODO (hans): Implement add workspace modal view
          onClick={onOpen}
          icon={<BiPlus />}
          justifySelf="flex-end"
        />
      )}
    </Flex>
  )
}
