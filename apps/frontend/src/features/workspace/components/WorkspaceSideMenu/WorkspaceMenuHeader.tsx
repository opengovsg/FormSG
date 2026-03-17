import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: false })
  return (
    <Flex
      justifyContent="space-between"
      pl={{ base: '0rem', md: '2rem' }}
      pr={{ base: '1rem', md: '1.5rem' }}
      mt={{ base: 0, lg: '1rem' }}
      {...props}
      alignItems="center"
    >
      {isOpen && <CreateWorkspaceModal isOpen={isOpen} onClose={onClose} />}
      <Flex alignItems="center">
        {shouldShowMenuIcon && (
          <IconButton
            icon={<BiMenuAltLeft />}
            onClick={() => onMenuClick && onMenuClick()}
            aria-label={t('features.workspace.sideMenu.aria.openDrawer')}
            variant="clear"
            colorScheme="primary"
            color="secondary.500"
            mr="0.25rem"
          />
        )}
        <Text textStyle="h4" color="secondary.700">
          {t('features.workspace.sideMenu.header')}
        </Text>
      </Flex>

      {shouldShowAddWorkspaceButton && (
        <IconButton
          size="lg"
          aria-label={t('features.workspace.sideMenu.aria.createFolder')}
          variant="clear"
          colorScheme="primary"
          color="secondary.500"
          onClick={onOpen}
          icon={<BiPlus />}
          justifySelf="flex-end"
        />
      )}
    </Flex>
  )
}
