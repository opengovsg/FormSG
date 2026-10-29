import { CSSProperties, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BiIdCard } from 'react-icons/bi'
import { Box, BoxProps, forwardRef, Icon, Stack, Text } from '@chakra-ui/react'
import {
  Draggable,
  DraggableProvided,
  DraggableStateSnapshot,
} from '@hello-pangea/dnd'

import { FormAuthType, FormResponseMode } from 'formsg-shared/types'
import {
  AllowedMyInfoFieldOption,
  BasicField,
  MyInfoAttribute,
} from 'formsg-shared/types/field'
import {
  createLoginIdentityField,
  LOGIN_IDENTITY_LABELS,
  LoginIdentityAttribute,
} from 'formsg-shared/utils/login-identity'

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

import { useFieldLoginGate } from './FieldLoginContext'

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

interface DraggableBasicFieldOptionProps extends Omit<
  FieldOptionProps,
  'isActive'
> {
  index: number
  fieldType: BasicField
}

interface DraggableMyInfoFieldOptionProps extends Omit<
  FieldOptionProps,
  'isActive'
> {
  isDragDisabled?: boolean
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

interface DraggableLoginIdentityFieldOptionProps extends Omit<
  FieldOptionProps,
  'isActive'
> {
  index: number
  isDragDisabled?: boolean
  onConvert?: () => void
  attr: LoginIdentityAttribute
}

export const DraggableLoginIdentityFieldListOption = ({
  isDragDisabled,
  attr,
  index,
  isDisabled,
  ...props
}: DraggableLoginIdentityFieldOptionProps): JSX.Element => {
  const isMobile = useIsMobile()

  return (
    <Draggable
      index={index}
      isDragDisabled={isDragDisabled || isDisabled || isMobile}
      disableInteractiveElementBlocking
      // Basic options already use the field types as their ids.
      draggableId={`login-identity-${attr}`}
    >
      {(provided, snapshot) => (
        <>
          <LoginIdentityFieldOption
            attr={attr}
            isDisabled={isDisabled}
            {...props}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={getDraggableAnimationProps(provided, snapshot)}
            ref={provided.innerRef}
          />
          {snapshot.isDragging && (
            <LoginIdentityFieldOption
              attr={attr}
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

export const DraggableMyInfoFieldListOption = ({
  fieldType,
  index,
  isDisabled,
  isDragDisabled,
  ...props
}: DraggableMyInfoFieldOptionProps): JSX.Element => (
  <Draggable
    index={index}
    isDragDisabled={isDisabled || isDragDisabled}
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
    const { t } = useTranslation('translation', {
      keyPrefix: 'features.adminForm.sidebar.fields.fieldListOption',
    })
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
            <Text noOfLines={1}>{t('useForApprovals')}</Text>
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

    const requestLogin = useFieldLoginGate()
    const handleClick = useCallback(() => {
      if (isDisabled) return
      const add = () => updateCreateState(newFieldMeta, numFields)
      if (requestLogin) requestLogin(FormAuthType.MyInfo, add)
      else add()
    }, [newFieldMeta, numFields, updateCreateState, isDisabled, requestLogin])

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

interface LoginIdentityFieldOptionProps extends FieldOptionProps {
  onConvert?: () => void
  attr: LoginIdentityAttribute
}

export const LoginIdentityFieldOption = forwardRef<
  LoginIdentityFieldOptionProps,
  'button'
>(({ attr, isDisabled, onConvert, ...props }, ref) => {
  const { t } = useTranslation()
  const { data: form } = useCreateTabForm()
  const numFields = form?.form_fields?.length ?? 0

  const newFieldMeta = useMemo(() => createLoginIdentityField(attr), [attr])
  const meta = BASICFIELD_TO_DRAWER_META[newFieldMeta.fieldType]

  const updateCreateState = useFieldBuilderStore(updateCreateStateSelector)

  const requestLogin = useFieldLoginGate()
  const handleClick = useCallback(() => {
    if (isDisabled) return
    if (onConvert) onConvert()
    else {
      const add = () => updateCreateState(newFieldMeta, numFields)
      if (requestLogin)
        requestLogin(
          attr === MyInfoAttribute.UinFin
            ? FormAuthType.MyInfo
            : FormAuthType.CP,
          add,
        )
      else add()
    }
  }, [
    newFieldMeta,
    numFields,
    updateCreateState,
    isDisabled,
    onConvert,
    requestLogin,
    attr,
  ])

  return (
    <FieldListOption
      {...props}
      isDisabled={isDisabled}
      onClick={handleClick}
      ref={ref}
    >
      <Icon
        fontSize="1.5rem"
        as={newFieldMeta.fieldType === BasicField.Nric ? BiIdCard : meta.icon}
      />
      <Stack direction="row" spacing="0.5rem" align="center">
        <Text textStyle="body-1">{LOGIN_IDENTITY_LABELS[attr]}</Text>
        {form?.isSubmitterIdCollectionEnabled && (
          <Badge colorScheme="success">
            {t('features.adminForm.settings.tabs.newBadge')}
          </Badge>
        )}
      </Stack>
    </FieldListOption>
  )
})

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
