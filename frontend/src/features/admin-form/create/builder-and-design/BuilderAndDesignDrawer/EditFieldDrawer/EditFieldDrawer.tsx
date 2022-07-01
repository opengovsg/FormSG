import { memo, useCallback, useMemo } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import { Stack, Text } from '@chakra-ui/react'

import { BasicField, FieldCreateDto } from '~shared/types/field'

import IconButton from '~components/IconButton'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { isMyInfo } from '~features/myinfo/utils'

import { useBuilderFields } from '../../BuilderAndDesignContent/useBuilderFields'
import { MYINFO_FIELD_CONSTANTS } from '../../constants'
import {
  BuildFieldState,
  setToInactiveSelector,
  stateDataSelector,
  useBuilderAndDesignStore,
} from '../../useBuilderAndDesignStore'
import { CreatePageDrawerCloseButton } from '../CreatePageDrawerCloseButton'

import {
  EditAttachment,
  EditCheckbox,
  EditDate,
  EditDecimal,
  EditDropdown,
  EditEmail,
  EditHeader,
  EditHomeno,
  EditImage,
  EditLongText,
  EditMobile,
  EditMyInfo,
  EditNric,
  EditNumber,
  EditParagraph,
  EditRadio,
  EditRating,
  EditShortText,
  EditTable,
  EditUen,
  EditYesNo,
} from './edit-fieldtype'

export const EditFieldDrawer = (): JSX.Element | null => {
  const { stateData, setToInactive } = useBuilderAndDesignStore(
    useCallback(
      (state) => ({
        stateData: stateDataSelector(state),
        setToInactive: setToInactiveSelector(state),
      }),
      [],
    ),
  )

  const fieldToEdit: FieldCreateDto | undefined = useMemo(() => {
    if (
      stateData.state === BuildFieldState.EditingField ||
      stateData.state === BuildFieldState.CreatingField
    ) {
      return stateData.field
    }
  }, [stateData])

  const basicFieldText = useMemo(() => {
    if (!fieldToEdit?.fieldType) return ''
    if (isMyInfo(fieldToEdit)) {
      return MYINFO_FIELD_CONSTANTS[fieldToEdit.myInfo.attr].value
    }
    return BASICFIELD_TO_DRAWER_META[fieldToEdit?.fieldType].label
  }, [fieldToEdit])

  // Hacky method of determining when to rerender the drawer,
  // i.e. when the user clicks into a different field.
  // We pass `${fieldIndex}-${numFields}` as the key. If the
  // user was creating a new field but clicked into an existing
  // field, causing the new field to be discarded, then numFields
  // changes. If the user was editing an existing field then clicked
  // into another existing field, causing the edits to be discarded,
  // then fieldIndex changes.
  const { builderFields } = useBuilderFields()
  const fieldIndex = useMemo(() => {
    if (stateData.state === BuildFieldState.CreatingField) {
      return stateData.insertionIndex
    } else if (stateData.state === BuildFieldState.EditingField) {
      return builderFields?.findIndex(
        (field) => field._id === stateData.field._id,
      )
    }
  }, [builderFields, stateData])
  const numFields = useMemo(() => builderFields?.length, [builderFields])

  if (!fieldToEdit) return null

  return (
    <>
      <Stack
        direction="row"
        pos="sticky"
        top={0}
        px="1.5rem"
        py="1rem"
        align="center"
        borderBottom="1px solid var(--chakra-colors-neutral-300)"
        bg="white"
      >
        <IconButton
          size="sm"
          h="1.5rem"
          w="1.5rem"
          aria-label="Back to field selection"
          variant="clear"
          colorScheme="secondary"
          onClick={setToInactive}
          icon={<BiLeftArrowAlt />}
        />
        <Text
          textStyle="h4"
          as="h4"
          color="secondary.500"
          flex={1}
          textAlign="center"
        >
          Edit {basicFieldText}
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>
      <MemoFieldDrawerContent
        field={fieldToEdit}
        key={`${fieldIndex}-${numFields}`}
      />
    </>
  )
}

interface MemoFieldDrawerContentProps {
  field: FieldCreateDto
}

export const MemoFieldDrawerContent = memo<MemoFieldDrawerContentProps>(
  ({ field, ...props }) => {
    if (isMyInfo(field)) {
      return <EditMyInfo {...props} field={field} />
    }

    switch (field.fieldType) {
      case BasicField.Attachment:
        return <EditAttachment {...props} field={field} />
      case BasicField.Checkbox:
        return <EditCheckbox {...props} field={field} />
      case BasicField.Dropdown:
        return <EditDropdown {...props} field={field} />
      case BasicField.Mobile:
        return <EditMobile {...props} field={field} />
      case BasicField.HomeNo:
        return <EditHomeno {...props} field={field} />
      case BasicField.Email:
        return <EditEmail {...props} field={field} />
      case BasicField.Nric:
        return <EditNric {...props} field={field} />
      case BasicField.Number:
        return <EditNumber {...props} field={field} />
      case BasicField.Date:
        return <EditDate {...props} field={field} />
      case BasicField.Decimal:
        return <EditDecimal {...props} field={field} />
      case BasicField.Section:
        return <EditHeader {...props} field={field} />
      case BasicField.Uen:
        return <EditUen {...props} field={field} />
      case BasicField.YesNo:
        return <EditYesNo {...props} field={field} />
      case BasicField.Radio:
        return <EditRadio {...props} field={field} />
      case BasicField.Rating:
        return <EditRating {...props} field={field} />
      case BasicField.ShortText:
        return <EditShortText {...props} field={field} />
      case BasicField.Table:
        return <EditTable {...props} field={field} />
      case BasicField.LongText:
        return <EditLongText {...props} field={field} />
      case BasicField.Statement:
        return <EditParagraph {...props} field={field} />
      case BasicField.Image:
        return <EditImage {...props} field={field} />
      default:
        return <div>TODO: Insert field options here</div>
    }
  },
)
