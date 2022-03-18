import { useMemo } from 'react'
import { BiTrash } from 'react-icons/bi'
import {
  Box,
  Divider,
  Stack,
  StackDivider,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { LogicDto, LogicType } from '~shared/types/form'

import IconButton from '~components/IconButton'

import { useAdminFormLogic } from '../../../hooks/useAdminFormLogic'
import { DeleteLogicModal } from '../../DeleteLogicModal'

import { FieldLogicBadge } from './FieldLogicBadge'
import { LogicBadge } from './LogicBadge'
import { LogicConditionValues } from './LogicConditionValues'

interface LogicBlockProps {
  logic: LogicDto
}

export const LogicBlock = ({ logic }: LogicBlockProps): JSX.Element | null => {
  const { mapIdToField } = useAdminFormLogic()
  const { isOpen, onClose, onOpen } = useDisclosure()

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

  if (!mapIdToField) return null

  return (
    <Box
      borderRadius="4px"
      bg="white"
      border="1px solid"
      borderColor="neutral.300"
      pos="relative"
    >
      <DeleteLogicModal isOpen={isOpen} onClose={onClose} logicId={logic._id} />
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
      <IconButton
        top={{ base: '1.5rem', md: '2rem' }}
        right={{ base: '1.5rem', md: '2rem' }}
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
