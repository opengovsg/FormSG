import { CSSProperties, useCallback, useMemo } from 'react'
import { Box, BoxProps, forwardRef, Icon, Stack, Text } from '@chakra-ui/react'
import {
  Draggable,
  DraggableProvided,
  DraggableStateSnapshot,
} from '@hello-pangea/dnd'

import { FormResponseMode } from '~shared/types'
import { AllowedMyInfoFieldOption, BasicField } from '~shared/types/field'

import { useIsMobile } from '~hooks/useIsMobile'
import Badge from '~components/Badge'

import {
  BASICFIELD_TO_DRAWER_META,
  MYINFO_FIELD_TO_DRAWER_META,
} from '~features/admin-form/create/constants'

import { useCreateTabForm } from '../../useCreateTabForm'
import {
  updateCreateStateSelector,
  useFieldBuilderStore,
} from '../../useFieldBuilderStore'
import {
  getFieldCreationMeta,
  getMyInfoFieldCreationMeta,
} from '../../utils/fieldCreation'

const getDraggableAnimationProps = (
  provided: DraggableProvided,
  snapshot: DraggableStateSnapshot,
): CSSProperties => ({
  ...provided.draggableProps.style,
  // Speed up drop animation to smoothen out transition when field is
  // dropped into the builder.
  transition: snapshot.isDropAnimating
    ? '0.1s'
    : provided.draggableProps.style?.transition,
  transform: snapshot.isDragging
    ? provided.draggableProps.style?.transform
    : 'translate(0px, 0px)',
})

interface FieldOptionProps extends BoxProps {
  isActive?: boolean
  isDisabled?: boolean
}

interface BasicFieldOptionProps extends FieldOptionProps {
  fieldType: BasicField
}

interface MyInfoFieldOptionProps extends FieldOptionProps {
  fieldType: AllowedMyInfoFieldOption
}

interface DraggableBasicFieldOptionProps
  extends Omit<FieldOptionProps, 'isActive'> {
  index: number
  fieldType: BasicField
}

interface DraggableMyInfoFieldOptionProps
  extends Omit<FieldOptionProps, 'isActive'> {
  index: number
  fieldType: AllowedMyInfoFieldOption
}

export const DraggableBasicFieldListOption = ({
  fieldType,
  index,
  isDisabled,
  ...props
}: DraggableBasicFieldOptionProps): JSX.Element => {
  const isMobile = useIsMobile()

  return (
    <Draggable
      index={index}
      isDragDisabled={isDisabled || isMobile}
      disableInteractiveElementBlocking
      draggableId={fieldType}
    >
      {(provided, snapshot) => {
        return (
          <>
            <BasicFieldOption
              fieldType={fieldType}
              isDisabled={isDisabled}
              {...props}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={getDraggableAnimationProps(provided, snapshot)}
              ref={provided.innerRef}
            />
            {snapshot.isDragging && (
              <BasicFieldOption
                fieldType={fieldType}
                isActive={snapshot.isDragging}
                style={{ transform: 'none !important' }}
                opacity={0.5}
              />
            )}
          </>
        )
      }}
    </Draggable>
  )
}

export const DraggableMyInfoFieldListOption = ({
  fieldType,
  index,
  isDisabled,
  ...props
}: DraggableMyInfoFieldOptionProps): JSX.Element => (
  <Draggable
    index={index}
    isDragDisabled={isDisabled}
    disableInteractiveElementBlocking
    draggableId={fieldType}
  >
    {(provided, snapshot) => {
      return (
        <>
          <MyInfoFieldOption
            fieldType={fieldType}
            isDisabled={isDisabled}
            {...props}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={getDraggableAnimationProps(provided, snapshot)}
            ref={provided.innerRef}
          />
          {snapshot.isDragging && (
            <MyInfoFieldOption
              fieldType={fieldType}
              isActive={snapshot.isDragging}
              style={{ transform: 'none !important' }}
              opacity={0.5}
            />
          )}
        </>
      )
    }}
  </Draggable>
)

export const BasicFieldOption = forwardRef<BasicFieldOptionProps, 'button'>(
  ({ fieldType, isDisabled, ...props }, ref) => {
    const meta = useMemo(
      () => BASICFIELD_TO_DRAWER_META[fieldType],
      [fieldType],
    )
    const { data: form } = useCreateTabForm()
    const isMrf = form?.responseMode === FormResponseMode.Multirespondent
    const numFields = form?.form_fields?.length ?? 0

    const newFieldMeta = useMemo(
      () => getFieldCreationMeta(fieldType),
      [fieldType],
    )

    const updateCreateState = useFieldBuilderStore(updateCreateStateSelector)

    const handleClick = useCallback(() => {
      if (!isDisabled) {
        updateCreateState(newFieldMeta, numFields)
      }
    }, [newFieldMeta, numFields, updateCreateState, isDisabled])

    return (
      <FieldListOption
        {...props}
        isDisabled={isDisabled}
        onClick={handleClick}
        ref={ref}
      >
        <Icon fontSize="1.5rem" as={meta.icon} />
        <Text textStyle="body-1">{meta.label}</Text>
        {isMrf && fieldType === BasicField.YesNo ? (
          <Badge maxW="100%" variant="subtle" colorScheme="secondary">
            <Text noOfLines={1}>Use for approvals</Text>
          </Badge>
        ) : null}
      </FieldListOption>
    )
  },
)

export const MyInfoFieldOption = forwardRef<MyInfoFieldOptionProps, 'button'>(
  ({ fieldType, isDisabled, ...props }, ref) => {
    const meta = useMemo(
      () => MYINFO_FIELD_TO_DRAWER_META[fieldType],
      [fieldType],
    )
    const { data: form } = useCreateTabForm()
    const numFields = useMemo(() => form?.form_fields?.length ?? 0, [form])

    const newFieldMeta = useMemo(
      () => getMyInfoFieldCreationMeta(fieldType),
      [fieldType],
    )

    const updateCreateState = useFieldBuilderStore(updateCreateStateSelector)

    const handleClick = useCallback(() => {
      if (!isDisabled) updateCreateState(newFieldMeta, numFields)
    }, [newFieldMeta, numFields, updateCreateState, isDisabled])

    return (
      <FieldListOption
        {...props}
        isDisabled={isDisabled}
        onClick={handleClick}
        ref={ref}
      >
        <Icon fontSize="1.5rem" as={meta.icon} />
        <Text textStyle="body-1">{meta.label}</Text>
      </FieldListOption>
    )
  },
)

export const FieldListOption = forwardRef<FieldOptionProps, 'button'>(
  ({ isDisabled, isActive, children, ...props }, ref) => {
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
        _focus={{ bg: 'primary.100' }}
        _active={{ bg: 'primary.100' }}
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
          {children}
        </Stack>
      </Box>
    )
  },
)
