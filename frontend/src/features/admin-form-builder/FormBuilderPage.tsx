import { useCallback, useState } from 'react'
import {
  DragDropContext,
  DragStart,
  DragUpdate,
  DropResult,
} from 'react-beautiful-dnd'
import { Flex } from '@chakra-ui/react'

import { useAdminForm } from '~features/admin-form/common/queries'

import { BuilderContent } from './BuilderContent'
import { BuilderDrawer } from './BuilderDrawer'
import { BuilderDrawerProvider } from './BuilderDrawerContext'
import { BuilderSidebar } from './BuilderSidebar'
import { FIELD_LIST_DROPPABLE_ID } from './constants'
import { useMutateFormFields } from './mutations'

const dragHandleQueryAttr = 'data-rbd-drag-handle-draggable-id'
const dragContainerQueryAttr = 'data-rbd-draggable-id'
const destinationQuertAttr = 'data-rbd-droppable-id'

const getDragHandleDom = (draggableId: unknown) => {
  const domQuery = `[${dragHandleQueryAttr}='${draggableId}']`
  const draggedDOM = document.querySelector(domQuery)

  return draggedDOM
}
const getDragDom = (draggableId: unknown) => {
  const domQuery = `[${dragContainerQueryAttr}='${draggableId}']`
  const draggedDOM = document.querySelector(domQuery)

  return draggedDOM
}

const getDestinationDom = (dropabbleId: unknown) => {
  const domQuery = `[${destinationQuertAttr}='${dropabbleId}']`
  const destinationDOM = document.querySelector(domQuery)
  return destinationDOM
}

export type DndPlaceholderProps =
  | {
      droppableId: string
      clientHeight: number
      clientWidth: string
      clientY: number
      clientX: number
    }
  | Record<string, never>

export const FormBuilderPage = (): JSX.Element => {
  const { data } = useAdminForm()
  const { mutateReorderField } = useMutateFormFields()

  const [placeholderProps, setPlaceholderProps] = useState<DndPlaceholderProps>(
    {},
  )

  // onDrag handler functions to get props to render placeholders since
  // react-beautiful-dnd does not natively support custom placeholders.
  // See https://medium.com/@Dedanade/how-to-add-a-custom-placeholder-for-more-than-one-column-react-beautiful-dnd-3d59b64fe2d2
  // for original code.
  const onDragStart = useCallback(({ draggableId, source }: DragStart) => {
    const draggedDOM =
      source.droppableId === FIELD_LIST_DROPPABLE_ID
        ? getDragDom(draggableId)
        : getDragHandleDom(draggableId)

    if (!draggedDOM?.parentElement) {
      return
    }

    const sourceIndex = source.index
    const clientY =
      parseFloat(window.getComputedStyle(draggedDOM.parentElement).paddingTop) +
      [...draggedDOM.parentElement.children]
        .slice(0, sourceIndex)
        .reduce((total, curr) => {
          const style = window.getComputedStyle(curr)
          const marginBottom = parseFloat(style.marginBottom)
          return total + curr.clientHeight + marginBottom
        }, 0)

    const nextPlaceholderProps = {
      droppableId: source.droppableId,
      clientHeight: draggedDOM.clientHeight,
      clientWidth: '100%',
      clientY,
      clientX: parseFloat(
        window.getComputedStyle(draggedDOM.parentElement).paddingLeft,
      ),
    }
    setPlaceholderProps(nextPlaceholderProps)
  }, [])

  const onDragUpdate = useCallback(
    ({ source, destination, draggableId }: DragUpdate) => {
      if (!destination) {
        return
      }

      const draggedDOM =
        source.droppableId === FIELD_LIST_DROPPABLE_ID
          ? getDragDom(draggableId)
          : getDragHandleDom(draggableId)

      if (!draggedDOM?.parentElement) {
        return
      }

      const destinationIndex = destination.index
      const sourceIndex = source.index

      const childrenArray = [...draggedDOM.parentElement.children]
      const movedItem = childrenArray[sourceIndex]
      childrenArray.splice(sourceIndex, 1)

      const droppedDom = getDestinationDom(destination.droppableId)
      if (!droppedDom) return
      const destinationChildrenArray = [...droppedDom.children]
      let updatedArray
      if (draggedDOM.parentNode === droppedDom) {
        updatedArray = [
          ...childrenArray.slice(0, destinationIndex),
          movedItem,
          ...childrenArray.slice(destinationIndex + 1),
        ]
      } else {
        updatedArray = [
          ...destinationChildrenArray.slice(0, destinationIndex),
          movedItem,
          ...destinationChildrenArray.slice(destinationIndex + 1),
        ]
      }

      const clientY =
        parseFloat(
          window.getComputedStyle(draggedDOM.parentElement).paddingTop,
        ) +
        updatedArray.slice(0, destinationIndex).reduce((total, curr) => {
          const style = window.getComputedStyle(curr)
          const marginBottom = parseFloat(style.marginBottom)
          return total + curr.clientHeight + marginBottom
        }, 0)

      setPlaceholderProps({
        droppableId: source.droppableId,
        clientHeight: draggedDOM.clientHeight,
        clientWidth: '100%',
        clientY,
        clientX: parseFloat(
          window.getComputedStyle(draggedDOM.parentElement).paddingLeft,
        ),
      })
    },
    [],
  )

  const onDragEnd = useCallback(
    ({ source, destination }: DropResult) => {
      setPlaceholderProps({})
      if (source.droppableId !== FIELD_LIST_DROPPABLE_ID) return
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
        onDragStart={onDragStart}
        onDragUpdate={onDragUpdate}
        onDragEnd={onDragEnd}
      >
        <BuilderDrawerProvider>
          <BuilderSidebar />
          <BuilderDrawer />
        </BuilderDrawerProvider>
        <BuilderContent placeholderProps={placeholderProps} />
      </DragDropContext>
    </Flex>
  )
}
