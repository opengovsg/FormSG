import { useCallback } from 'react'
import { DragDropContext, DropResult } from 'react-beautiful-dnd'
import { Flex } from '@chakra-ui/react'

import { useAdminForm } from '~features/admin-form/common/queries'

import { BuilderContent } from './BuilderContent'
import { BuilderDrawer } from './BuilderDrawer'
import { BuilderDrawerProvider } from './BuilderDrawerContext'
import { BuilderSidebar } from './BuilderSidebar'
import { useMutateFormFields } from './mutations'

export const FormBuilderPage = (): JSX.Element => {
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
      if (source.droppableId !== 'formFieldList') return
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

  return (
    <Flex h="100%" w="100%" overflow="auto" bg="neutral.200" direction="row">
      <DragDropContext
        onBeforeCapture={onBeforeCapture}
        onBeforeDragStart={onBeforeDragStart}
        onDragStart={onDragStart}
        onDragUpdate={onDragUpdate}
        onDragEnd={onDragEnd}
      >
        <BuilderDrawerProvider>
          <BuilderSidebar />
          <BuilderDrawer />
        </BuilderDrawerProvider>
        <BuilderContent />
      </DragDropContext>
    </Flex>
  )
}
