import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { Draggable } from 'react-beautiful-dnd'
import { FormProvider, useForm } from 'react-hook-form'
import { BiCog, BiDuplicate, BiGridHorizontal, BiTrash } from 'react-icons/bi'
import { useIsMutating } from 'react-query'
import {
  Box,
  ButtonGroup,
  chakra,
  Collapse,
  Fade,
  Flex,
  Icon,
} from '@chakra-ui/react'
import { times } from 'lodash'

import { FormColorTheme } from '~shared/types'
import { BasicField, FormFieldDto } from '~shared/types/field'

import { useIsMobile } from '~hooks/useIsMobile'
import IconButton from '~components/IconButton'
import {
  AttachmentField,
  CheckboxField,
  DateField,
  DecimalField,
  DropdownField,
  EmailField,
  HomeNoField,
  ImageField,
  LongTextField,
  MobileField,
  NricField,
  NumberField,
  ParagraphField,
  RadioField,
  RatingField,
  ShortTextField,
  TableField,
  UenField,
  YesNoField,
} from '~templates/Field'
import { createTableRow } from '~templates/Field/Table/utils/createRow'

import { adminFormKeys } from '~features/admin-form/common/queries'
import { useCreatePageSidebar } from '~features/admin-form/create/common/CreatePageSidebarContext'
import {
  augmentWithMyInfoDisplayValue,
  extractPreviewValue,
  hasExistingFieldValue,
} from '~features/myinfo/utils'

import { useBuilderAndDesignContext } from '../../BuilderAndDesignContext'
import { PENDING_CREATE_FIELD_ID } from '../../constants'
import { useDeleteFormField } from '../../mutations/useDeleteFormField'
import { useDuplicateFormField } from '../../mutations/useDuplicateFormField'
import {
  BuildFieldState,
  setToInactiveSelector,
  stateDataSelector,
  updateEditStateSelector,
  useBuilderAndDesignStore,
} from '../../useBuilderAndDesignStore'
import { useDesignColorTheme } from '../../utils/useDesignColorTheme'

import { SectionFieldRow } from './SectionFieldRow'

export interface FieldRowContainerProps {
  field: FormFieldDto
  index: number
  isVisible: boolean
  isDraggingOver: boolean
}

export const FieldRowContainer = ({
  field,
  index,
  isVisible,
  isDraggingOver,
}: FieldRowContainerProps): JSX.Element => {
  const isMobile = useIsMobile()
  const numFormFieldMutations = useIsMutating(adminFormKeys.base)
  const { stateData, setToInactive, updateEditState } =
    useBuilderAndDesignStore(
      useCallback(
        (state) => ({
          stateData: stateDataSelector(state),
          setToInactive: setToInactiveSelector(state),
          updateEditState: updateEditStateSelector(state),
        }),
        [],
      ),
    )

  const { handleBuilderClick } = useCreatePageSidebar()

  const { duplicateFieldMutation } = useDuplicateFormField()
  const { deleteFieldMutation } = useDeleteFormField()

  const colorTheme = useDesignColorTheme()

  const defaultFieldValues = useMemo(() => {
    if (field.fieldType === BasicField.Table) {
      return {
        [field._id]: times(field.minimumRows || 0, () => createTableRow(field)),
      }
    }

    const augmentedField = augmentWithMyInfoDisplayValue(field)

    if (hasExistingFieldValue(augmentedField)) {
      return {
        [field._id]: extractPreviewValue(augmentedField),
      }
    }
  }, [field])

  const formMethods = useForm<FormFieldDto>({
    mode: 'onChange',
    defaultValues: defaultFieldValues,
  })

  const isActive = useMemo(() => {
    if (stateData.state === BuildFieldState.EditingField) {
      return field._id === stateData.field._id
    } else if (stateData.state === BuildFieldState.CreatingField) {
      return field._id === PENDING_CREATE_FIELD_ID
    }
    return false
  }, [stateData, field])

  const {
    deleteFieldModalDisclosure: { onOpen: onDeleteModalOpen },
  } = useBuilderAndDesignContext()

  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (isActive) {
      ref.current?.scrollIntoView({
        // Avoid sudden jump when field is clicked
        block: 'nearest',
        // Also avoid behavior: 'smooth' as scrolling may take very long
        // on long forms
      })
    }
  }, [isActive])

  const handleFieldClick = useCallback(() => {
    if (!isActive) {
      updateEditState(field)
      if (!isMobile) {
        // Do not open builder if in mobile so user can view active state without
        // drawer blocking the view.
        handleBuilderClick()
      }
    }
  }, [isActive, updateEditState, field, isMobile, handleBuilderClick])

  const handleKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleFieldClick()
      }
    },
    [handleFieldClick],
  )

  const handleEditFieldClick = useCallback(() => {
    if (isMobile) {
      handleBuilderClick()
    }
  }, [handleBuilderClick, isMobile])

  const handleDuplicateClick = useCallback(() => {
    // Duplicate button should be hidden if field
    // is not yet created, but guard here just in case
    if (stateData.state !== BuildFieldState.CreatingField) {
      duplicateFieldMutation.mutate(field._id)
    }
  }, [stateData.state, duplicateFieldMutation, field._id])

  const handleDeleteClick = useCallback(() => {
    if (stateData.state === BuildFieldState.CreatingField) {
      setToInactive()
    } else if (stateData.state === BuildFieldState.EditingField) {
      onDeleteModalOpen()
    }
  }, [setToInactive, stateData.state, onDeleteModalOpen])

  const isAnyMutationLoading = useMemo(
    () => duplicateFieldMutation.isLoading || deleteFieldMutation.isLoading,
    [duplicateFieldMutation, deleteFieldMutation],
  )

  return (
    <Draggable
      index={index}
      isDragDisabled={
        !isActive ||
        !!numFormFieldMutations ||
        stateData.state === BuildFieldState.CreatingField
      }
      disableInteractiveElementBlocking
      draggableId={field._id}
    >
      {(provided, snapshot) => (
        <Box
          _first={{ pt: 0 }}
          _last={{ pb: 0 }}
          m="0.75rem"
          py="0.375rem"
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          <Flex
            // Offset for focus boxShadow
            my="2px"
            // Focusable
            tabIndex={0}
            role="button"
            cursor={isActive ? 'initial' : 'pointer'}
            bg="white"
            transition="background 0.2s ease"
            _hover={{ bg: isDraggingOver ? 'white' : 'secondary.100' }}
            borderRadius="4px"
            outline="none"
            {...(isActive ? { 'data-active': true } : {})}
            _focusWithin={{
              boxShadow: snapshot.isDragging
                ? 'md'
                : '0 0 0 2px var(--chakra-colors-primary-500) !important',
            }}
            _active={{
              bg: 'secondary.100',
              boxShadow: snapshot.isDragging
                ? 'md'
                : '0 0 0 2px var(--chakra-colors-primary-500)',
            }}
            flexDir="column"
            align="center"
            onClick={handleFieldClick}
            onKeyDown={handleKeydown}
            ref={ref}
          >
            <Fade in={isActive}>
              <chakra.button
                display="flex"
                tabIndex={isActive ? 0 : -1}
                {...provided.dragHandleProps}
                borderRadius="4px"
                _focus={{
                  boxShadow: snapshot.isDragging
                    ? undefined
                    : '0 0 0 2px var(--chakra-colors-neutral-500)',
                }}
              >
                <Icon
                  transition="color 0.2s ease"
                  _hover={{
                    color: 'secondary.300',
                  }}
                  color={
                    snapshot.isDragging ? 'secondary.300' : 'secondary.200'
                  }
                  as={BiGridHorizontal}
                  fontSize="1.5rem"
                />
              </chakra.button>
            </Fade>
            <Box
              px={{ base: '0.75rem', md: '1.5rem' }}
              pb={{ base: '0.75rem', md: '1.5rem' }}
              w="100%"
              pointerEvents={isActive ? undefined : 'none'}
              opacity={isActive || isVisible ? '100%' : '30%'}
            >
              <FormProvider {...formMethods}>
                <MemoFieldRow field={field} colorTheme={colorTheme} />
              </FormProvider>
            </Box>
            <Collapse in={isActive} style={{ width: '100%' }}>
              <Flex
                px={{ base: '0.75rem', md: '1.5rem' }}
                flex={1}
                borderTop="1px solid var(--chakra-colors-neutral-300)"
                justify="flex-end"
              >
                <ButtonGroup
                  variant="clear"
                  colorScheme="secondary"
                  spacing={0}
                >
                  {isMobile ? (
                    <IconButton
                      variant="clear"
                      colorScheme="secondary"
                      aria-label="Edit field"
                      icon={<BiCog fontSize="1.25rem" />}
                      onClick={handleEditFieldClick}
                    />
                  ) : null}
                  {
                    // Fields which are not yet created cannot be duplicated
                    stateData.state !== BuildFieldState.CreatingField && (
                      <IconButton
                        aria-label="Duplicate field"
                        isDisabled={isAnyMutationLoading}
                        onClick={handleDuplicateClick}
                        isLoading={duplicateFieldMutation.isLoading}
                        icon={<BiDuplicate fontSize="1.25rem" />}
                      />
                    )
                  }
                  <IconButton
                    colorScheme="danger"
                    aria-label="Delete field"
                    icon={<BiTrash fontSize="1.25rem" />}
                    onClick={handleDeleteClick}
                    isLoading={deleteFieldMutation.isLoading}
                    isDisabled={isAnyMutationLoading}
                  />
                </ButtonGroup>
              </Flex>
            </Collapse>
          </Flex>
        </Box>
      )}
    </Draggable>
  )
}

type MemoFieldRowProps = {
  field: FormFieldDto
  colorTheme?: FormColorTheme
}

const MemoFieldRow = memo(({ field, ...rest }: MemoFieldRowProps) => {
  switch (field.fieldType) {
    case BasicField.Section:
      return <SectionFieldRow field={field} {...rest} />
    case BasicField.Image:
      return <ImageField schema={field} {...rest} />
    case BasicField.Statement:
      return <ParagraphField schema={field} {...rest} />
    case BasicField.Attachment:
      return <AttachmentField schema={field} {...rest} />
    case BasicField.Checkbox:
      return <CheckboxField schema={field} {...rest} />
    case BasicField.Mobile:
      return <MobileField schema={field} {...rest} />
    case BasicField.HomeNo:
      return <HomeNoField schema={field} {...rest} />
    case BasicField.Email:
      return <EmailField schema={field} {...rest} />
    case BasicField.Nric:
      return <NricField schema={field} {...rest} />
    case BasicField.Number:
      return <NumberField schema={field} {...rest} />
    case BasicField.Decimal:
      return <DecimalField schema={field} {...rest} />
    case BasicField.Date:
      return <DateField schema={field} {...rest} />
    case BasicField.Dropdown:
      return <DropdownField schema={field} {...rest} />
    case BasicField.ShortText:
      return <ShortTextField schema={field} {...rest} />
    case BasicField.LongText:
      return <LongTextField schema={field} {...rest} />
    case BasicField.Radio:
      return <RadioField schema={field} {...rest} />
    case BasicField.Rating:
      return <RatingField schema={field} {...rest} />
    case BasicField.Uen:
      return <UenField schema={field} {...rest} />
    case BasicField.YesNo:
      return <YesNoField schema={field} {...rest} />
    case BasicField.Table:
      return <TableField schema={field} {...rest} />
  }
})
