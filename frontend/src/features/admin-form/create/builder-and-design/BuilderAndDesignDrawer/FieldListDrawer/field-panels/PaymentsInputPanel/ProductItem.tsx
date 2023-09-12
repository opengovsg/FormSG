import { BiDotsHorizontalRounded, BiEditAlt, BiTrash } from 'react-icons/bi'
import {
  Box,
  ButtonGroup,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tr,
  useDisclosure,
} from '@chakra-ui/react'

import { Product } from '~shared/types'
import { centsToDollars } from '~shared/utils/payments'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import IconButton from '~components/IconButton'

export const ProductItem = ({
  product,
  onEditClick,
  onDeleteClick,
  isDisabled,
}: {
  product: Product
  onEditClick: () => void
  onDeleteClick: () => void
  isDisabled: boolean
}) => {
  const isMobile = useIsMobile()
  return (
    <>
      <Box px="1rem" py="1rem" backgroundColor={'#F8F9FD'}>
        <Flex justifyContent="center" alignItems="center">
          <Box flexGrow={1}>
            <Flex justifyContent="space-between">
              <Text textStyle="subhead-1" pb="0.25rem" color="secondary.500">
                {product.name}
              </Text>
              {isMobile && (
                <MobileProductItemMenu
                  isDisabled={isDisabled}
                  onDeleteClick={onDeleteClick}
                  onEditClick={onEditClick}
                />
              )}
            </Flex>
            <TableContainer>
              <Table
                style={{
                  borderCollapse: 'separate',
                  borderSpacing: '0 0',
                }}
              >
                <Tbody>
                  <Tr>
                    <Td
                      py="0"
                      pl="0"
                      pr="1rem"
                      borderBottom="0"
                      textAlign="left"
                      textStyle="caption-1"
                      color="secondary.400"
                      w="1%"
                    >
                      Amount
                    </Td>
                    <Td
                      p="0"
                      borderBottom="0"
                      textStyle="caption-1"
                      color="secondary.500"
                    >
                      S${centsToDollars(product.amount_cents)}
                    </Td>
                  </Tr>
                  {product.multi_qty && (
                    <Tr>
                      <Td
                        py="0"
                        pl="0"
                        pr="1rem"
                        borderBottom="0"
                        textStyle="caption-1"
                        color="secondary.400"
                        w="1%"
                      >
                        Quantity limit
                      </Td>
                      <Td
                        p="0"
                        borderBottom="0"
                        textStyle="caption-1"
                        color="secondary.500"
                      >
                        between {product.min_qty} to {product.max_qty}
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>

          {!isMobile && (
            <DesktopProductItemButtonGroup
              isDisabled={isDisabled}
              onDeleteClick={onDeleteClick}
              onEditClick={onEditClick}
            />
          )}
        </Flex>
      </Box>
    </>
  )
}

const DesktopProductItemButtonGroup = ({
  isDisabled,
  onEditClick,
  onDeleteClick,
}: {
  isDisabled: boolean
  onEditClick: () => void
  onDeleteClick: () => void
}) => {
  return (
    <ButtonGroup variant="clear" colorScheme="secondary" spacing={0}>
      <IconButton
        isDisabled={isDisabled}
        icon={<BiEditAlt type="solid" />}
        color="primary.500"
        aria-label={'Edit'}
        onClick={onEditClick}
      />
      <IconButton
        isDisabled={isDisabled}
        icon={<BiTrash />}
        color="danger.500"
        aria-label={'Delete'}
        onClick={onDeleteClick}
      />
    </ButtonGroup>
  )
}

const MobileProductItemMenu = ({
  isDisabled,
  onEditClick,
  onDeleteClick,
}: {
  isDisabled: boolean
  onEditClick: () => void
  onDeleteClick: () => void
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Box display={{ md: 'none' }}>
      <IconButton
        variant="clear"
        aria-label="More options"
        icon={<BiDotsHorizontalRounded fontSize="1.25rem" />}
        onClick={onOpen}
        size="xs"
        isDisabled={isDisabled}
      />
      <Drawer placement="bottom" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent borderTopRadius="0.25rem">
          <DrawerBody px={0} py="0.5rem">
            <ButtonGroup
              flexDir="column"
              spacing={0}
              w="100%"
              variant="clear"
              colorScheme="secondary"
            >
              <Button
                onClick={onEditClick}
                leftIcon={<BiEditAlt fontSize="1.25rem" />}
                justifyContent="left"
              >
                Edit
              </Button>
              <Divider />
              <Button
                onClick={onDeleteClick}
                color="danger.500"
                leftIcon={<BiTrash fontSize="1.25rem" />}
                justifyContent="left"
              >
                Delete
              </Button>
            </ButtonGroup>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}
