import { ReactNode } from 'react'
import { BiChevronsLeft, BiChevronsRight } from 'react-icons/bi'
import { GoDotFill } from 'react-icons/go'
import {
  Box,
  Button,
  ButtonProps,
  forwardRef,
  Icon,
  Stack,
  StackProps,
  Text,
  useTab,
  UseTabProps,
} from '@chakra-ui/react'

import Badge from '~components/Badge'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { ADMIN_FORM_SIDE_NAV_WIDTH } from './constants'

export const SideNavCollapseControl = ({
  isCollapsed,
  onClick,
  trackingLabel,
}: {
  isCollapsed: boolean
  onClick: () => void
  trackingLabel?: string
}) => {
  const label = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
  const control = (
    <Tooltip label={label} placement="right">
      <IconButton
        variant="solid"
        colorScheme="subtle"
        size="lg"
        alignSelf="center"
        icon={isCollapsed ? <BiChevronsRight /> : <BiChevronsLeft />}
        borderRadius="full"
        aria-label={label}
        data-dd-action-name={trackingLabel}
        onClick={onClick}
      />
    </Tooltip>
  )
  return isCollapsed ? (
    <Box
      pos="fixed"
      bottom="1rem"
      left="0.5rem"
      zIndex="docked"
      data-testid="sidebar-collapse-toggle"
    >
      {control}
    </Box>
  ) : (
    control
  )
}

interface AdminFormSideNavProps extends StackProps {
  footer?: ReactNode
}

export const AdminFormSideNav = forwardRef<AdminFormSideNavProps, 'div'>(
  ({ children, footer, ...props }, ref) => (
    <Stack
      ref={ref}
      bg="white"
      pos="sticky"
      top={0}
      px="0.75rem"
      py="1rem"
      borderRight="1px solid"
      borderColor="neutral.300"
      direction="column"
      justifyContent="space-between"
      w={ADMIN_FORM_SIDE_NAV_WIDTH}
      minW={ADMIN_FORM_SIDE_NAV_WIDTH}
      flexShrink={0}
      minH={0}
      overflow="hidden"
      alignSelf="stretch"
      {...props}
    >
      <Box
        flex={1}
        minH={0}
        overflowY="auto"
        mx="-0.25rem"
        px="0.25rem"
        my="-0.25rem"
        py="0.25rem"
        sx={{
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {children}
      </Box>
      {footer && (
        <Stack flexShrink={0} spacing="0.5rem">
          {footer}
        </Stack>
      )}
    </Stack>
  ),
)

interface SideNavItemProps extends ButtonProps {
  icon: ReactNode
  label: string
  isActive?: boolean
  showRedDot?: boolean
  badgeText?: string
}

export const AdminFormSideNavItem = forwardRef<SideNavItemProps, 'button'>(
  ({ icon, label, isActive = false, showRedDot, badgeText, ...props }, ref) => (
    <Button
      ref={ref}
      variant="unstyled"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap="0.25rem"
      w="100%"
      h="auto"
      p={0}
      border={0}
      borderRadius="0.25rem"
      whiteSpace="nowrap"
      _focusVisible={{ boxShadow: 'none' }}
      sx={{
        '&:focus-visible .side-nav-icon, &[data-focus-visible] .side-nav-icon':
          { boxShadow: '0 0 0 4px var(--chakra-colors-primary-300)' },
        '&:hover .side-nav-icon': {
          bg: 'primary.100',
          borderColor: 'primary.100',
        },
        '&:active .side-nav-icon': {
          bg: 'primary.200',
          borderColor: 'primary.200',
        },
      }}
      {...props}
    >
      <Box as="span" position="relative" data-testid="drawer-tab-icon-box">
        <Box
          as="span"
          className="side-nav-icon"
          display="flex"
          alignItems="center"
          justifyContent="center"
          boxSize="2.75rem"
          border="1px solid"
          borderColor={isActive ? 'primary.200' : 'white'}
          bg={isActive ? 'primary.200' : 'white'}
          color="primary.500"
          borderRadius="0.25rem"
          fontSize="1.25rem"
        >
          {icon}
        </Box>
        {showRedDot && (
          <Icon
            as={GoDotFill}
            data-testid="drawer-tab-reddot"
            color="danger.500"
            position="absolute"
            top="-2px"
            right="-2px"
          />
        )}
      </Box>
      <Text
        as="span"
        textStyle="caption-2"
        fontWeight={isActive ? 500 : 400}
        color={isActive ? 'primary.500' : 'secondary.400'}
        whiteSpace="nowrap"
      >
        {label}
      </Text>
      {badgeText && (
        <Badge
          aria-hidden="true"
          colorScheme="primary"
          variant="subtle"
          color="secondary.500"
        >
          {badgeText}
        </Badge>
      )}
    </Button>
  ),
)

export const AdminFormSideNavTab = forwardRef<
  SideNavItemProps & UseTabProps,
  'button'
>((props, ref) => {
  const tab = useTab({ ...props, ref })
  return (
    <AdminFormSideNavItem
      {...props}
      {...tab}
      isActive={Boolean(tab['aria-selected'])}
    />
  )
})
