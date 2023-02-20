import { useCallback } from 'react'
import { BiCheck, BiFilter, BiSearch, BiX } from 'react-icons/bi'
import {
  Box,
  ButtonGroup,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  forwardRef,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  MenuButton,
  MenuItemOption,
  MenuOptionGroup,
  Portal,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Menu from '~components/Menu'

import { FilterOption } from '~features/workspace/types'
import { FILTER_OPTIONS } from '~features/workspace/utils/dashboardFilter'

import {
  useWorkspaceSearchbar,
  WorkspaceSearchbarProps,
} from './WorkspaceSearchbar'

export interface MobileWorkspaceSearchbarProps extends WorkspaceSearchbarProps {
  isExpanded: boolean
  onToggleExpansion: () => void
}

const SelectedFilterAffordance = ({ show }: { show?: boolean }) => {
  return (
    <>
      <BiFilter fontSize="1.25rem" />
      {show && (
        <Flex
          aria-hidden
          width="1rem"
          height="1rem"
          as="span"
          color="white"
          position="absolute"
          top="-0.5rem"
          right="-0.5rem"
          textStyle="legal"
          bg="primary.500"
          borderRadius="50%"
          zIndex="banner"
          align="center"
          justify="center"
        >
          1
        </Flex>
      )}
    </>
  )
}

export const MobileWorkspaceSearchbar = forwardRef<
  MobileWorkspaceSearchbarProps,
  'input'
>(
  (
    { isExpanded, onToggleExpansion, placeholder, ...props },
    ref,
  ): JSX.Element => {
    const {
      internalFilter,
      internalValue,
      setInternalFilter,
      setInternalValue,
      hasFilter,
    } = useWorkspaceSearchbar(props)

    const isMobile = useIsMobile()

    const { isOpen, onClose, onOpen } = useDisclosure()

    const handleToggle = useCallback(() => {
      if (isExpanded) {
        setInternalValue('')
      }
      onToggleExpansion()
    }, [isExpanded, onToggleExpansion, setInternalValue])

    return (
      // Note: gridArea labels are coupled with the gridTemplateAreas definition in WorkspaceHeader.
      <>
        {isExpanded ? (
          <InputGroup gridArea="search">
            <InputLeftElement>
              <Icon as={BiSearch} color="secondary.500" fontSize="1.25rem" />
            </InputLeftElement>
            <Input
              ref={ref}
              value={internalValue}
              placeholder={placeholder}
              onChange={(e) => setInternalValue(e.target.value)}
            />
            <InputRightElement right="1px">
              <IconButton
                aria-label="Close and reset search bar"
                icon={<BiX />}
                onClick={handleToggle}
                fontSize="1.25rem"
                variant="clear"
                size="sm"
                colorScheme="secondary"
                minH="auto"
              />
            </InputRightElement>
          </InputGroup>
        ) : (
          <Box gridArea="searchIcon">
            <IconButton
              aria-label="Expand search bar"
              colorScheme="secondary"
              variant="clear"
              onClick={handleToggle}
              icon={<BiSearch fontSize="1.25rem" />}
            />
          </Box>
        )}

        <Box gridArea="filter">
          <Menu placement="bottom-end">
            <MenuButton
              pos="relative"
              width="min-content"
              as={IconButton}
              colorScheme="secondary"
              variant="clear"
              aria-label="Filter forms"
              icon={<SelectedFilterAffordance show={hasFilter} />}
              rightIcon={undefined}
              backgroundColor={hasFilter ? 'neutral.200' : undefined}
              onClick={onOpen}
            />
            {isMobile || (
              <Portal>
                <Menu.List>
                  <MenuOptionGroup
                    type="radio"
                    value={internalFilter}
                    onChange={(val) => setInternalFilter(val as FilterOption)}
                  >
                    {FILTER_OPTIONS.map((value, i) => (
                      <MenuItemOption
                        key={i}
                        iconSpacing="1.5rem"
                        value={value}
                      >
                        {value}
                      </MenuItemOption>
                    ))}
                  </MenuOptionGroup>
                </Menu.List>
              </Portal>
            )}
          </Menu>
        </Box>

        {/* Drawer for filter in mobile */}
        {isMobile && (
          <Drawer placement="bottom" onClose={onClose} isOpen={isOpen}>
            <DrawerOverlay />
            <DrawerContent borderTopRadius="0.25rem">
              <DrawerBody px={0} py="0.5rem">
                <ButtonGroup flexDir="column" spacing={0} w="100%">
                  {FILTER_OPTIONS.map((option, i) => (
                    <Button
                      key={i}
                      isFullWidth={true}
                      justifyContent="flex-start"
                      variant="clear"
                      colorScheme="secondary"
                      textStyle="body-1"
                      onClick={() => {
                        setInternalFilter(option)
                        onClose()
                      }}
                    >
                      <Stack
                        direction="row"
                        justify="flex-start"
                        alignItems="center"
                        w="100%"
                      >
                        {internalFilter === option ? (
                          <BiCheck fontSize="1.25rem" />
                        ) : (
                          <Box w="1.25rem"> </Box>
                        )}
                        <Text>{option}</Text>
                      </Stack>
                    </Button>
                  ))}
                </ButtonGroup>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        )}
      </>
    )
  },
)
