import { useCallback, useState } from 'react'
import {
  DragDropContext,
  DragStart,
  DragUpdate,
  DropResult,
} from 'react-beautiful-dnd'

import { getFieldCreationMeta } from '~features/admin-form/create/builder-and-design/utils/fieldCreation'

import { useReorderFormField } from './mutations/useReorderFormField'
import {
  getPlaceholderStartProps,
  getPlaceholderUpdateProps,
} from './utils/dnd'
import { BuilderAndDesignContent } from './BuilderAndDesignContent'
import { BuilderAndDesignDrawer } from './BuilderAndDesignDrawer'
import {
  CREATE_FIELD_DROP_ID,
  CREATE_FIELD_FIELDS_ORDERED,
  CREATE_PAGE_DROP_ID,
  CREATE_PAGE_FIELDS_ORDERED,
  FIELD_LIST_DROP_ID,
} from './constants'
import { DndPlaceholderProps } from './types'
import {
  updateCreateStateSelector,
  useBuilderAndDesignStore,
} from './useBuilderAndDesignStore'
import { useCreateTabForm } from './useCreateTabForm'

export const BuilderAndDesignTab = (): JSX.Element => {
  const setToCreating = useBuilderAndDesignStore(updateCreateStateSelector)
  const { data } = useCreateTabForm()

  const { reorderFieldMutation } = useReorderFormField()

  const [placeholderProps, setPlaceholderProps] = useState<DndPlaceholderProps>(
    {},
  )

  const onDragStart = useCallback(
    (dragStart: DragStart) => {
      const startPlaceholderProps = getPlaceholderStartProps(dragStart)
      if (startPlaceholderProps) {
        setPlaceholderProps(startPlaceholderProps)
      }
    },
    [setPlaceholderProps],
  )

  const onDragUpdate = useCallback(
    (dragUpdate: DragUpdate) => {
      const updatePlaceholderProps = getPlaceholderUpdateProps(dragUpdate)
      if (updatePlaceholderProps) {
        setPlaceholderProps(updatePlaceholderProps)
      }
    },
    [setPlaceholderProps],
  )

  const onDragEnd = useCallback(
    ({ source, destination }: DropResult) => {
      setPlaceholderProps({})

      if (!data || !destination) return

      switch (source.droppableId) {
        case CREATE_PAGE_DROP_ID: {
          return setToCreating(
            getFieldCreationMeta(CREATE_PAGE_FIELDS_ORDERED[source.index]),
            destination.index,
          )
        }
        case CREATE_FIELD_DROP_ID: {
          return setToCreating(
            getFieldCreationMeta(CREATE_FIELD_FIELDS_ORDERED[source.index]),
            destination.index,
          )
        }
        case FIELD_LIST_DROP_ID: {
          if (destination.index === source.index) {
            return
          }
          return reorderFieldMutation.mutate({
            fields: data.form_fields,
            from: source.index,
            to: destination.index,
          })
        }
      }
    },
    [data, reorderFieldMutation, setToCreating, setPlaceholderProps],
  )

  return (
    <DragDropContext
      onDragStart={onDragStart}
      onDragUpdate={onDragUpdate}
      onDragEnd={onDragEnd}
    >
      <BuilderAndDesignDrawer />
      <BuilderAndDesignContent placeholderProps={placeholderProps} />
    </DragDropContext>
  )
}
