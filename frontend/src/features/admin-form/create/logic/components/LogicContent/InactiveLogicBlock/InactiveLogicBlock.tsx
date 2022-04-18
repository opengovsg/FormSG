import { useCallback, useMemo } from 'react'
import { BiTrash } from 'react-icons/bi'
import {
  Box,
  chakra,
  Divider,
  Stack,
  StackDivider,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { LogicDto, LogicType } from '~shared/types/form'

import IconButton from '~components/IconButton'

import {
  createOrEditDataSelector,
  setToEditingSelector,
  useAdminLogicStore,
} from '../../../adminLogicStore'
import { useAdminFormLogic } from '../../../hooks/useAdminFormLogic'
import { DeleteLogicModal } from '../../DeleteLogicModal'

import { FieldLogicBadge } from './FieldLogicBadge'
import { LogicBadge } from './LogicBadge'
import { LogicConditionValues } from './LogicConditionValues'

interface InactiveLogicBlockProps {
  logic: LogicDto
}

export const InactiveLogicBlock = ({
  logic,
}: InactiveLogicBlockProps): JSX.Element | null => {
  const { mapIdToField } = useAdminFormLogic()
  const { isOpen, onClose, onOpen } = useDisclosure()
  const setToEditing = useAdminLogicStore(setToEditingSelector)
  const stateData = useAdminLogicStore(createOrEditDataSelector)

  // Prevent editing logic if some other logic block is being edited.
  const isPreventEdit = useMemo(() => !!stateData, [stateData])

  const renderThenContent = useMemo(() => {
    if (!mapIdToField) return null

    switch (logic.logicType) {
      case LogicType.ShowFields:
        return (
          <>
            <Text>then show</Text>
            <Stack direction="column" spacing="0.25rem">
              {logic.show.map((fieldId, index) => (
                <FieldLogicBadge key={index} field={mapIdToField[fieldId]} />
              ))}
            </Stack>
          </>
        )
      case LogicType.PreventSubmit:
        return (
          <>
            <Text>then disable submission</Text>
            <LogicBadge>{logic.preventSubmitMessage}</LogicBadge>
          </>
        )
    }
  }, [logic, mapIdToField])

  const handleClick = useCallback(() => {
    if (isPreventEdit) {
      return
    }
    setToEditing(logic._id)
  }, [isPreventEdit, logic._id, setToEditing])

  if (!mapIdToField) return null

  return (
    <Box pos="relative">
      <chakra.button
        type="button"
        w="100%"
        textAlign="start"
        borderRadius="4px"
        bg="white"
        border="1px solid"
        borderColor="neutral.300"
        transitionProperty="common"
        transitionDuration="normal"
        cursor={isPreventEdit ? 'not-allowed' : 'pointer'}
        disabled={isPreventEdit}
        aria-disabled={isPreventEdit}
        _hover={{
          _disabled: {
            bg: 'white',
          },
          bg: 'primary.100',
        }}
        _focus={{
          boxShadow: `0 0 0 4px var(--chakra-colors-primary-300)`,
        }}
        onClick={handleClick}
      >
        <DeleteLogicModal
          isOpen={isOpen}
          onClose={onClose}
          logicId={logic._id}
        />
        <Stack
          spacing="1.5rem"
          divider={<StackDivider borderColor="secondary.100" />}
          p={{ base: '1.5rem', md: '2rem' }}
        >
          {logic.conditions.map((condition, index) => (
            <Stack
              key={index}
              spacing="1.5rem"
              textStyle="subhead-3"
              color="secondary.500"
            >
              <Stack>
                <Text>{index === 0 ? 'If' : 'and'}</Text>
                <FieldLogicBadge field={mapIdToField[condition.field]} />
              </Stack>
              <Stack>
                <Text>{condition.state}</Text>
                <LogicConditionValues value={condition.value} />
              </Stack>
            </Stack>
          ))}
        </Stack>

        <Divider borderBottomWidth="2px" borderColor="secondary.200" />
        <Stack
          textStyle="subhead-3"
          color="secondary.500"
          p={{ base: '1.5rem', md: '2rem' }}
        >
          {renderThenContent}
        </Stack>
      </chakra.button>
      <IconButton
        top={{ base: '0.5rem', md: '2rem' }}
        right={{ base: '0.5rem', md: '2rem' }}
        pos="absolute"
        aria-label="Delete logic"
        variant="clear"
        colorScheme="danger"
        onClick={onOpen}
        icon={<BiTrash fontSize="1.5rem" />}
      />
    </Box>
  )
}
