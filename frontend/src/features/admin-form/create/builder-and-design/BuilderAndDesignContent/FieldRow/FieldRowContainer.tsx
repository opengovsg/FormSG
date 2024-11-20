import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
import { Draggable } from '@hello-pangea/dnd'
import { isEqual, times } from 'lodash'

import { FormColorTheme, FormResponseMode } from '~shared/types'
import { BasicField, FormFieldDto } from '~shared/types/field'

import { useIsMobile } from '~hooks/useIsMobile'
import { useToast } from '~hooks/useToast'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'
import {
  AttachmentField,
  CheckboxField,
  ChildrenCompoundField,
  CountryRegionField,
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
import { EmailFieldInput } from '~templates/Field/Email'
import { MobileFieldInput } from '~templates/Field/Mobile'
import { createTableRow } from '~templates/Field/Table/utils/createRow'

import { adminFormKeys } from '~features/admin-form/common/queries'
import { CreatePageSidebarContextProps } from '~features/admin-form/create/common'
import {
  augmentWithMyInfoDisplayValue,
  extractPreviewValue,
  hasExistingFieldValue,
  isMyInfo,
} from '~features/myinfo/utils'

import { useBuilderAndDesignContext } from '../../BuilderAndDesignContext'
import {
  setToInactiveSelector as setPaymentToInactiveSelector,
  usePaymentStore,
} from '../../BuilderAndDesignDrawer/FieldListDrawer/field-panels/usePaymentStore'
import { useDeleteFormField } from '../../mutations/useDeleteFormField'
import { useDuplicateFormField } from '../../mutations/useDuplicateFormField'
import { useCreateTabForm } from '../../useCreateTabForm'
import {
  DesignState,
  setStateSelector as setDesignStateSelector,
  useDesignStore,
} from '../../useDesignStore'
import {
  FieldBuilderState,
  setToInactiveSelector,
  updateEditStateSelector,
  useFieldBuilderStore,
} from '../../useFieldBuilderStore'
import { getAttachmentSizeLimit } from '../../utils/getAttachmentSizeLimit'

import { SectionFieldRow } from './SectionFieldRow'
import { VerifiableFieldBuilderContainer } from './VerifiableFieldBuilderContainer'

export interface FieldRowContainerProps {
  responseMode: FormResponseMode
  field: FormFieldDto
  index: number
  isHiddenByLogic: boolean
  isDraggingOver?: boolean
  // Field only needs to know fieldBuilderState if it is active, else it is agnostic to state
  fieldBuilderState?: FieldBuilderState
  isDirty: boolean
  colorTheme?: FormColorTheme
  // handleBuilderClick is passed down to prevent unnecessary re-renders from useContext
  handleBuilderClick: CreatePageSidebarContextProps['handleBuilderClick']
}

const FieldRowContainer = ({
  responseMode,
  field,
  index,
  isHiddenByLogic,
  isDraggingOver,
  fieldBuilderState,
  isDirty,
  colorTheme,
  handleBuilderClick,
}: FieldRowContainerProps): JSX.Element => {
  const isMobile = useIsMobile()
  const numFormFieldMutations = useIsMutating(adminFormKeys.base)
  const updateEditState = useFieldBuilderStore(updateEditStateSelector)

  const setDesignState = useDesignStore(setDesignStateSelector)
  const setPaymentStateToInactive = usePaymentStore(
    setPaymentToInactiveSelector,
  )

  const isMyInfoField = useMemo(() => isMyInfo(field), [field])

  // Explicitly defining isActive here to prevent constant checks to undefined
  // due to falsy nature of FieldBuilderState.CreatingField = 0
  const isActive = fieldBuilderState !== undefined

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
    if (isActive) return

    if (isDirty) {
      return updateEditState(field, true)
    }
    updateEditState(field)
    setDesignState(DesignState.Inactive)
    setPaymentStateToInactive()

    if (!isMobile) {
      // Do not open builder if in mobile so user can view active state without
      // drawer blocking the view.
      handleBuilderClick(false)
    }
  }, [
    isActive,
    isDirty,
    updateEditState,
    field,
    setDesignState,
    setPaymentStateToInactive,
    isMobile,
    handleBuilderClick,
  ])

  const handleKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleFieldClick()
      }
    },
    [handleFieldClick],
  )

  const isDragDisabled = useMemo(() => {
    return (
      !isActive ||
      isDirty ||
      !!numFormFieldMutations ||
      fieldBuilderState === FieldBuilderState.CreatingField
    )
  }, [isActive, isDirty, numFormFieldMutations, fieldBuilderState])

  return (
    <Draggable
      index={index}
      isDragDisabled={isDragDisabled}
      disableInteractiveElementBlocking
      draggableId={field._id}
    >
      {(provided, snapshot) => (
        <Box
          _first={{ pt: 0 }}
          _last={{ pb: 0 }}
          py="0.375rem"
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          <Tooltip
            hidden={!isHiddenByLogic}
            placement="top"
            label="This field may be hidden by your form logic"
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
                  disabled={isDragDisabled}
                  display="flex"
                  tabIndex={isActive ? 0 : -1}
                  {...provided.dragHandleProps}
                  borderRadius="4px"
                  _disabled={{
                    cursor: 'not-allowed',
                    opacity: 0.4,
                  }}
                  _focus={{
                    boxShadow: snapshot.isDragging
                      ? undefined
                      : '0 0 0 2px var(--chakra-colors-neutral-500)',
                  }}
                  transition="color 0.2s ease"
                  _hover={{
                    color: 'secondary.300',
                    _disabled: {
                      color: 'secondary.200',
                    },
                  }}
                  color={
                    snapshot.isDragging ? 'secondary.300' : 'secondary.200'
                  }
                >
                  {fieldBuilderState === FieldBuilderState.EditingField &&
                  !isDragDisabled ? (
                    <Icon as={BiGridHorizontal} fontSize="1.5rem" />
                  ) : (
                    <Box h="1.5rem"></Box>
                  )}
                </chakra.button>
              </Fade>
              <Box
                px={{ base: '0.75rem', md: '1.5rem' }}
                pb={{ base: '0.75rem', md: '1.5rem' }}
                w="100%"
                pointerEvents={isActive ? undefined : 'none'}
                opacity={isActive || !isHiddenByLogic ? '100%' : '30%'}
              >
                <FormProvider {...formMethods}>
                  <FieldRow
                    field={field}
                    colorTheme={colorTheme}
                    responseMode={responseMode}
                    showMyInfoBadge={isMyInfoField}
                  />
                </FormProvider>
              </Box>
              <Collapse in={isActive} style={{ width: '100%' }}>
                {isActive && (
                  <FieldButtonGroup
                    field={field}
                    fieldBuilderState={fieldBuilderState}
                    isMobile={isMobile}
                    handleBuilderClick={handleBuilderClick}
                  />
                )}
              </Collapse>
            </Flex>
          </Tooltip>
        </Box>
      )}
    </Draggable>
  )
}

export const MemoizedFieldRow = memo(FieldRowContainer, (prevProps, newProps) =>
  isEqual(prevProps, newProps),
)

type FieldButtonGroupProps = {
  field: FormFieldDto
  fieldBuilderState: FieldBuilderState
  isMobile: boolean
  handleBuilderClick: CreatePageSidebarContextProps['handleBuilderClick']
}

const FieldButtonGroup = ({
  field,
  fieldBuilderState,
  isMobile,
  handleBuilderClick,
}: FieldButtonGroupProps) => {
  const { t } = useTranslation()
  const setToInactive = useFieldBuilderStore(setToInactiveSelector)

  const { data: form } = useCreateTabForm()

  const toast = useToast({ status: 'danger', isClosable: true })

  const { duplicateFieldMutation } = useDuplicateFormField()
  const { deleteFieldMutation } = useDeleteFormField()
  const {
    deleteFieldModalDisclosure: { onOpen: onDeleteModalOpen },
  } = useBuilderAndDesignContext()

  const handleEditFieldClick = useCallback(() => {
    if (isMobile) {
      handleBuilderClick(false)
    }
  }, [handleBuilderClick, isMobile])

  const isAnyMutationLoading = useMemo(
    () => duplicateFieldMutation.isLoading || deleteFieldMutation.isLoading,
    [duplicateFieldMutation, deleteFieldMutation],
  )
  const handleDuplicateClick = useCallback(() => {
    // Duplicate button should be hidden if field is not yet created, but guard here just in case
    if (fieldBuilderState === FieldBuilderState.CreatingField) return
    // Disallow duplicating attachment fields if after the dupe, the filesize exceeds the limit

    if (field.fieldType === BasicField.Attachment) {
      // Get remaining available attachment size limit
      const availableAttachmentSize = form
        ? getAttachmentSizeLimit(form.responseMode) -
          form.form_fields.reduce(
            (sum, ff) =>
              ff.fieldType === BasicField.Attachment
                ? sum + Number(ff.attachmentSize)
                : sum,
            0,
          )
        : 0
      const thisAttachmentSize = Number(field.attachmentSize)
      if (thisAttachmentSize > availableAttachmentSize) {
        toast({
          useMarkdown: true,
          description: `The field "${field.title}" could not be duplicated. The attachment size of **${thisAttachmentSize} MB** exceeds the form's remaining available attachment size of **${availableAttachmentSize} MB**.`,
        })
        return
      }
    }
    duplicateFieldMutation.mutate(field._id)
  }, [form, fieldBuilderState, field, duplicateFieldMutation, toast])

  const handleDeleteClick = useCallback(() => {
    if (fieldBuilderState === FieldBuilderState.CreatingField) {
      setToInactive()
    } else if (fieldBuilderState === FieldBuilderState.EditingField) {
      onDeleteModalOpen()
    }
  }, [setToInactive, fieldBuilderState, onDeleteModalOpen])

  return (
    <Flex
      px={{ base: '0.75rem', md: '1.5rem' }}
      flex={1}
      borderTop="1px solid var(--chakra-colors-neutral-300)"
      justify="flex-end"
    >
      <ButtonGroup variant="clear" colorScheme="secondary" spacing={0}>
        {isMobile ? (
          <IconButton
            variant="clear"
            colorScheme="secondary"
            aria-label={t('features.common.tooltip.editField')}
            icon={<BiCog fontSize="1.25rem" />}
            onClick={handleEditFieldClick}
          />
        ) : null}
        {
          // Fields which are not yet created cannot be duplicated
          fieldBuilderState !== FieldBuilderState.CreatingField && (
            <Tooltip label={t('features.common.tooltip.duplicateField')}>
              <IconButton
                aria-label={t('features.common.tooltip.duplicateField')}
                isDisabled={isAnyMutationLoading}
                onClick={handleDuplicateClick}
                isLoading={duplicateFieldMutation.isLoading}
                icon={<BiDuplicate fontSize="1.25rem" />}
              />
            </Tooltip>
          )
        }
        <Tooltip label={t('features.common.tooltip.deleteField')}>
          <IconButton
            colorScheme="danger"
            aria-label={t('features.common.tooltip.deleteField')}
            icon={<BiTrash fontSize="1.25rem" />}
            onClick={handleDeleteClick}
            isLoading={deleteFieldMutation.isLoading}
            isDisabled={isAnyMutationLoading}
          />
        </Tooltip>
      </ButtonGroup>
    </Flex>
  )
}

type FieldRowProps = {
  field: FormFieldDto
  colorTheme?: FormColorTheme
  responseMode: FormResponseMode
  showMyInfoBadge?: boolean
}

const FieldRow = ({ field, ...rest }: FieldRowProps) => {
  switch (field.fieldType) {
    case BasicField.Section:
      return <SectionFieldRow field={field} {...rest} />
    case BasicField.Image:
      return <ImageField schema={field} {...rest} />
    case BasicField.Statement:
      return <ParagraphField schema={field} {...rest} />
    case BasicField.Attachment: {
      const showDownload =
        rest.responseMode === FormResponseMode.Multirespondent
      return (
        <AttachmentField schema={field} {...rest} showDownload={showDownload} />
      )
    }
    case BasicField.Checkbox:
      return <CheckboxField schema={field} {...rest} />
    case BasicField.Mobile:
      return field.isVerifiable ? (
        <VerifiableFieldBuilderContainer schema={field} {...rest}>
          <MobileFieldInput schema={field} />
        </VerifiableFieldBuilderContainer>
      ) : (
        <MobileField schema={field} {...rest} />
      )
    case BasicField.HomeNo:
      return <HomeNoField schema={field} {...rest} />
    case BasicField.Email:
      return field.isVerifiable ? (
        <VerifiableFieldBuilderContainer schema={field} {...rest}>
          <EmailFieldInput schema={field} />
        </VerifiableFieldBuilderContainer>
      ) : (
        <EmailField schema={field} {...rest} />
      )
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
    case BasicField.CountryRegion:
      return <CountryRegionField schema={field} {...rest} />
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
    case BasicField.Children:
      return <ChildrenCompoundField schema={field} {...rest} />
  }
}
