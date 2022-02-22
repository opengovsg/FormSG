import { memo, useCallback, useEffect } from 'react'
import { Droppable } from 'react-beautiful-dnd'
import { Box, Flex } from '@chakra-ui/react'

import { AdminFormDto } from '~shared/types/form'

import { BuilderDesignPlaceholder } from './components/BuilderDesignPlaceholder'
import FieldRow from './components/FieldRow'
import { FIELD_LIST_DROP_ID } from './constants'
import { useEditFieldStore } from './editFieldStore'
import { DndPlaceholderProps } from './types'
import { useBuilderFormFields } from './useBuilderFormFields'

interface BuilderAndDesignContentProps {
  placeholderProps: DndPlaceholderProps
}

export const BuilderAndDesignContent = ({
  placeholderProps,
}: BuilderAndDesignContentProps): JSX.Element => {
  const { clearActiveField, clearFieldToCreate } = useEditFieldStore(
    useCallback((state) => {
      return {
        clearActiveField: state.clearActiveField,
        clearFieldToCreate: state.clearFieldToCreate,
      }
    }, []),
  )
  const { builderFields } = useBuilderFormFields()

  useEffect(() => {
    // Clear field on component unmount.
    return () => {
      clearActiveField()
      clearFieldToCreate()
    }
  }, [clearActiveField, clearFieldToCreate])

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
          <Droppable droppableId={FIELD_LIST_DROP_ID}>
            {(provided, snapshot) => (
              <Box
                pos="relative"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <BuilderFields fields={builderFields} />
                {provided.placeholder}
                {snapshot.isDraggingOver ? (
                  <BuilderDesignPlaceholder
                    placeholderProps={placeholderProps}
                  />
                ) : null}
              </Box>
            )}
          </Droppable>
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
          <FieldRow index={i} key={f._id} field={f} />
        ))}
      </>
    )
  },
  (prev, next) => prev.fields === next.fields,
)
