import { memo, useMemo } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import { Box, Flex } from '@chakra-ui/react'

import { BasicField, FormFieldDto } from '~shared/types/field'

import IconButton from '~components/IconButton'

import {
  activeFieldSelector,
  clearActiveFieldSelector,
  useEditFieldStore,
} from '../editFieldStore'
import { BuilderDrawerCloseButton } from '../FieldRow/BuilderDrawerCloseButton'
import { transformBasicFieldToText } from '../utils'

import { EditCheckbox } from './EditCheckbox'
import { EditHeader } from './EditHeader'

export const EditFieldDrawer = (): JSX.Element | null => {
  const clearActiveField = useEditFieldStore(clearActiveFieldSelector)
  const activeField = useEditFieldStore(activeFieldSelector)

  const basicFieldText = useMemo(
    () => transformBasicFieldToText(activeField?.fieldType),
    [activeField?.fieldType],
  )

  if (!activeField) return null

  return (
    <Box>
      <Flex
        pos="sticky"
        top={0}
        px="1.5rem"
        py="1rem"
        align="center"
        borderBottom="1px solid var(--chakra-colors-neutral-300)"
        bg="white"
      >
        <IconButton
          minH="1.5rem"
          minW="1.5rem"
          aria-label="Back to field selection"
          variant="clear"
          colorScheme="secondary"
          onClick={clearActiveField}
          icon={<BiLeftArrowAlt />}
        />
        <Box m="auto">Edit {basicFieldText} field</Box>
        <BuilderDrawerCloseButton />
      </Flex>
      <MemoFieldDrawerContent field={activeField} />
    </Box>
  )
}

const MemoFieldDrawerContent = memo(({ field }: { field: FormFieldDto }) => {
  switch (field.fieldType) {
    case BasicField.Section:
      return <EditHeader field={field} />
    case BasicField.Checkbox:
      return <EditCheckbox field={field} />
    default:
      return <div>TODO: Insert field options here</div>
  }
})
