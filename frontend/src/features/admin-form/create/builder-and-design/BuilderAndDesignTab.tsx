import { useCallback, useEffect, useState } from 'react'
import {
  DragDropContext,
  DragStart,
  DragUpdate,
  DropResult,
} from 'react-beautiful-dnd'

import { getFieldCreationMeta } from '~features/admin-form/create/builder-and-design/utils'

import { useReorderFormField } from './mutations/useReorderFormField'
import { BuilderAndDesignContent } from './BuilderAndDesignContent'
import { BuilderAndDesignDrawer } from './BuilderAndDesignDrawer'
import {
  CREATE_FIELD_DROP_ID,
  CREATE_FIELD_FIELDS_ORDERED,
  CREATE_PAGE_DROP_ID,
  CREATE_PAGE_FIELDS_ORDERED,
  FIELD_LIST_DROP_ID,
} from './constants'
import {
  getPlaceholderStartProps,
  getPlaceholderUpdateProps,
} from './dndHelpers'
import { DndPlaceholderProps } from './types'
import {
  setFieldsSelector,
  updateCreateStateSelector,
  useBuilderAndDesignStore,
} from './useBuilderAndDesignStore'
import { useCreateTabForm } from './useCreateTabForm'

export const BuilderAndDesignTab = (): JSX.Element => {
  const setToCreating = useBuilderAndDesignStore(updateCreateStateSelector)
  const setFields = useBuilderAndDesignStore(setFieldsSelector)
  const { data } = useCreateTabForm()
  useEffect(() => {
    if (data?.form_fields) {
      setFields(data.form_fields)
    }
  }, [data?.form_fields, setFields])
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
