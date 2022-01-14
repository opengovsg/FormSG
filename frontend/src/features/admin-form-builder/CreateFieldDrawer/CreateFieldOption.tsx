import { useMemo } from 'react'
import { Draggable } from 'react-beautiful-dnd'
import { Box, BoxProps, forwardRef, Icon, Stack, Text } from '@chakra-ui/react'

import { BasicField } from '~shared/types/field'

import { FIELDS_TO_CREATE_META } from './constants'

interface FieldOptionProps extends BoxProps {
  isActive?: boolean
  isDisabled?: boolean
  fieldType: BasicField
}

interface DraggableFieldOptionProps extends Omit<FieldOptionProps, 'isActive'> {
  index: number
}

export const DraggableCreateFieldOption = ({
  fieldType,
  index,
  ...props
}: DraggableFieldOptionProps): JSX.Element => {
  return (
    <Draggable
      index={index}
      disableInteractiveElementBlocking
      draggableId={fieldType}
    >
      {(provided, snapshot) => (
        <>
          <CreateFieldOption
            fieldType={fieldType}
            {...props}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...provided.draggableProps.style,
              transform: snapshot.isDragging
                ? provided.draggableProps.style?.transform
                : 'translate(0px, 0px)',
            }}
            ref={provided.innerRef}
          />
          {snapshot.isDragging && (
            <CreateFieldOption
              fieldType={fieldType}
              isActive={snapshot.isDragging}
              style={{ transform: 'none !important' }}
              opacity={0.5}
            />
          )}
        </>
      )}
    </Draggable>
  )
}

export const CreateFieldOption = forwardRef<FieldOptionProps, 'button'>(
  ({ fieldType, isDisabled, isActive, ...props }, ref) => {
    const meta = useMemo(() => FIELDS_TO_CREATE_META[fieldType], [fieldType])

    return (
      <Box
        transition="background 0.2s ease"
        px="1.5rem"
        // Props to trigger styling for the specific states
        {...(isDisabled ? { 'data-disabled': true } : {})}
        {...(isActive ? { 'data-active': true } : {})}
        _disabled={{
          opacity: 0.5,
          cursor: 'not-allowed',
          _hover: { bg: 'white' },
          _focus: { bg: 'white' },
        }}
        _hover={{ bg: 'primary.100' }}
        _focus={{ bg: 'primary.200' }}
        _active={{ bg: 'primary.200' }}
        bg="white"
        {...props}
        ref={ref}
      >
        <Stack
          py="1rem"
          spacing="1.5rem"
          direction="row"
          align="center"
          color="secondary.500"
        >
          <Icon fontSize="1.5rem" as={meta.icon} />
          <Text textStyle="body-1">{meta.label}</Text>
        </Stack>
      </Box>
    )
  },
)
