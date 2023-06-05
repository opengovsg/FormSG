import { useCallback, useState } from 'react'
import {
  DragDropContext,
  DragStart,
  DragUpdate,
  DropResult,
} from 'react-beautiful-dnd'
import { useDisclosure } from '@chakra-ui/react'

import {
  getFieldCreationMeta,
  getMyInfoFieldCreationMeta,
} from '~features/admin-form/create/builder-and-design/utils/fieldCreation'

import { useReorderFormField } from './mutations/useReorderFormField'
import {
  getPlaceholderStartProps,
  getPlaceholderUpdateProps,
} from './utils/dnd'
import { BuilderAndDesignContent } from './BuilderAndDesignContent'
import { BuilderAndDesignContext } from './BuilderAndDesignContext'
import { BuilderAndDesignDrawer } from './BuilderAndDesignDrawer'
import {
  BASIC_FIELDS_ORDERED,
  CREATE_FIELD_DROP_ID,
  CREATE_MYINFO_CONTACT_DROP_ID,
  CREATE_MYINFO_CONTACT_FIELDS_ORDERED,
  CREATE_MYINFO_MARRIAGE_DROP_ID,
  CREATE_MYINFO_MARRIAGE_FIELDS_ORDERED,
  CREATE_MYINFO_PARTICULARS_DROP_ID,
  CREATE_MYINFO_PARTICULARS_FIELDS_ORDERED,
  CREATE_MYINFO_PERSONAL_DROP_ID,
  CREATE_MYINFO_PERSONAL_FIELDS_ORDERED,
  FIELD_LIST_DROP_ID,
} from './constants'
import { DeleteFieldModal } from './DeleteFieldModal'
import { DndPlaceholderProps } from './types'
import { useCreateTabForm } from './useCreateTabForm'
import {
  updateCreateStateSelector,
  useFieldBuilderStore,
} from './useFieldBuilderStore'

export const BuilderAndDesignTab = (): JSX.Element => {
  const setToCreating = useFieldBuilderStore(updateCreateStateSelector)
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
        case CREATE_FIELD_DROP_ID: {
          return setToCreating(
            getFieldCreationMeta(BASIC_FIELDS_ORDERED[source.index]),
            destination.index,
          )
        }

        case CREATE_MYINFO_PERSONAL_DROP_ID: {
          return setToCreating(
            getMyInfoFieldCreationMeta(
              CREATE_MYINFO_PERSONAL_FIELDS_ORDERED[source.index],
            ),
            destination.index,
          )
        }

        case CREATE_MYINFO_CONTACT_DROP_ID: {
          return setToCreating(
            getMyInfoFieldCreationMeta(
              CREATE_MYINFO_CONTACT_FIELDS_ORDERED[source.index],
            ),
            destination.index,
          )
        }

        case CREATE_MYINFO_PARTICULARS_DROP_ID: {
          return setToCreating(
            getMyInfoFieldCreationMeta(
              CREATE_MYINFO_PARTICULARS_FIELDS_ORDERED[source.index],
            ),
            destination.index,
          )
        }

        case CREATE_MYINFO_MARRIAGE_DROP_ID: {
          return setToCreating(
            getMyInfoFieldCreationMeta(
              CREATE_MYINFO_MARRIAGE_FIELDS_ORDERED[source.index],
            ),
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

  const deleteFieldModalDisclosure = useDisclosure()

  return (
    <DragDropContext
      onDragStart={onDragStart}
      onDragUpdate={onDragUpdate}
      onDragEnd={onDragEnd}
    >
      <BuilderAndDesignContext.Provider
        value={{
          deleteFieldModalDisclosure,
        }}
      >
        <BuilderAndDesignDrawer />
        <BuilderAndDesignContent placeholderProps={placeholderProps} />
        {deleteFieldModalDisclosure.isOpen && <DeleteFieldModal />}
      </BuilderAndDesignContext.Provider>
    </DragDropContext>
  )
}
