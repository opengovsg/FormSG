import { useEffect } from 'react'
import { Droppable } from 'react-beautiful-dnd'
import { BiPlus } from 'react-icons/bi'
import { Box, Flex, Modal, ModalOverlay, useDisclosure } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import IconButton from '~components/IconButton'

import { FIELD_LIST_DROP_ID } from '../constants'
import { MobileCreateEditModal } from '../MobileCreateEditModal'
import { DndPlaceholderProps } from '../types'
import {
  setToInactiveSelector,
  useBuilderAndDesignStore,
} from '../useBuilderAndDesignStore'

import { EmptyFormPlaceholder } from './BuilderAndDesignPlaceholder/EmptyFormPlaceholder'
import BuilderAndDesignPlaceholder from './BuilderAndDesignPlaceholder'
import { BuilderFields } from './BuilderFields'
import { useBuilderFields } from './useBuilderFields'

interface BuilderAndDesignContentProps {
  placeholderProps: DndPlaceholderProps
}

export const BuilderAndDesignContent = ({
  placeholderProps,
}: BuilderAndDesignContentProps): JSX.Element => {
  const setFieldsToInactive = useBuilderAndDesignStore(setToInactiveSelector)
  const { builderFields } = useBuilderFields()

  useEffect(() => setFieldsToInactive, [setFieldsToInactive])

  const isMobile = useIsMobile()
  const {
    isOpen: isMobileModalOpen,
    onOpen: onMobileModalOpen,
    onClose: onMobileModalClose,
  } = useDisclosure()

  return (
    <>
      <Flex flex={1} bg="neutral.200" overflow="auto">
        <Flex
          m={{ base: 0, md: '2rem' }}
          mb={0}
          flex={1}
          bg={{ base: 'secondary.100', md: 'primary.100' }}
          p={{ base: '1.5rem', md: '2.5rem' }}
          justify="center"
          overflow="auto"
        >
          <Flex
            h="fit-content"
            bg="white"
            p={{ base: 0, md: '2.5rem' }}
            maxW="57rem"
            w="100%"
            flexDir="column"
          >
            <Droppable droppableId={FIELD_LIST_DROP_ID}>
              {(provided, snapshot) =>
                builderFields?.length ? (
                  <Box
                    pos="relative"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <BuilderFields
                      fields={builderFields}
                      isDraggingOver={snapshot.isDraggingOver}
                    />
                    {provided.placeholder}
                    <BuilderAndDesignPlaceholder
                      placeholderProps={placeholderProps}
                      isDraggingOver={snapshot.isDraggingOver}
                    />
                  </Box>
                ) : (
                  <EmptyFormPlaceholder
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    isDraggingOver={snapshot.isDraggingOver}
                    onMobileModalOpen={onMobileModalOpen}
                  />
                )
              }
            </Droppable>
          </Flex>
        </Flex>
      </Flex>
      {isMobile && (
        <Modal
          isOpen={isMobileModalOpen}
          onClose={onMobileModalClose}
          size="full"
        >
          <ModalOverlay />
          <MobileCreateEditModal />
        </Modal>
      )}
      {isMobile && (
        <IconButton
          aria-label="Add an element"
          icon={<BiPlus />}
          position="absolute"
          right="1.5rem"
          bottom="5.5rem"
          w="3rem"
          h="3rem"
          onClick={onMobileModalOpen}
        />
      )}
    </>
  )
}
