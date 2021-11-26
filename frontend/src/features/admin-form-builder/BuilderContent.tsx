import { useCallback, useEffect } from 'react'
import { DragDropContext, Droppable } from 'react-beautiful-dnd'
import { Flex, Stack } from '@chakra-ui/react'

import { useAdminForm } from '~features/admin-form/common/queries'

import { FieldRowContainer } from './FieldRow/FieldRowContainer'
import { clearActiveFieldSelector, useEditFieldStore } from './editFieldStore'

export const BuilderContent = (): JSX.Element => {
  const clearActiveField = useEditFieldStore(clearActiveFieldSelector)

  const onBeforeCapture = useCallback(() => {
    /*...*/
  }, [])
  const onBeforeDragStart = useCallback(() => {
    /*...*/
  }, [])
  const onDragStart = useCallback(() => {
    /*...*/
  }, [])
  const onDragUpdate = useCallback(() => {
    /*...*/
  }, [])
  const onDragEnd = useCallback(() => {
    // the only one that is required
  }, [])

  useEffect(() => {
    // Clear field on component unmount.
    return () => clearActiveField()
  }, [clearActiveField])

  return (
    <Flex flex={1} bg="neutral.200">
      <Flex
        m="2rem"
        mb={0}
        flex={1}
        bg="primary.100"
        p="2.5rem"
        justify="center"
        overflow="auto"
      >
        <Flex
          h="fit-content"
          bg="white"
          p="2.5rem"
          maxW="57rem"
          w="100%"
          flexDir="column"
        >
          <DragDropContext
            onBeforeCapture={onBeforeCapture}
            onBeforeDragStart={onBeforeDragStart}
            onDragStart={onDragStart}
            onDragUpdate={onDragUpdate}
            onDragEnd={onDragEnd}
          >
            <Droppable droppableId="formFieldList">
              {(provided) => (
                <Stack
                  spacing="2.25rem"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <BuilderFields />
                  {provided.placeholder}
                </Stack>
              )}
            </Droppable>
          </DragDropContext>
        </Flex>
      </Flex>
    </Flex>
  )
}

export const BuilderFields = () => {
  const { data, isLoading } = useAdminForm()

  if (!data || isLoading) {
    return <div>Loading...</div>
  }

  return (
    <>
      {data.form_fields.map((f, i) => (
        <FieldRowContainer index={i} key={f._id} field={f} />
      ))}
    </>
  )
}
