import { memo, useCallback, useEffect } from 'react'
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd'
import { Flex, Stack } from '@chakra-ui/react'

import { AdminFormDto } from '~shared/types/form'

import { useAdminForm } from '~features/admin-form/common/queries'

import { FieldRowContainer } from './FieldRow/FieldRowContainer'
import { clearActiveFieldSelector, useEditFieldStore } from './editFieldStore'
import { useMutateFormFields } from './mutations'

export const BuilderContent = (): JSX.Element => {
  const clearActiveField = useEditFieldStore(clearActiveFieldSelector)
  const { data } = useAdminForm()
  const { mutateReorderField } = useMutateFormFields()

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
  const onDragEnd = useCallback(
    ({ source, destination }: DropResult) => {
      if (!data || !destination || destination.index === source.index) {
        return
      }
      return mutateReorderField.mutate({
        fields: data.form_fields,
        from: source.index,
        to: destination.index,
      })
    },
    [data, mutateReorderField],
  )

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
                  <BuilderFields fields={data?.form_fields} />
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

const BuilderFields = memo(
  ({ fields }: { fields: AdminFormDto['form_fields'] | undefined }) => {
    if (!fields) {
      return <div>Loading...</div>
    }

    return (
      <>
        {fields.map((f, i) => (
          <FieldRowContainer index={i} key={f._id} field={f} />
        ))}
      </>
    )
  },
  (prev, next) => prev.fields === next.fields,
)
