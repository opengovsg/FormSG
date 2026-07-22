import { useCallback, useMemo } from 'react'
import { BiPencil } from 'react-icons/bi'
import { Box, Divider, Stack, StackDivider, Text } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { LogicDto, LogicType } from 'formsg-shared/types/form'

import IconButton from '~components/IconButton'

import {
  createOrEditDataSelector,
  requestSwitchToSelector,
  setToEditingSelector,
  useAdminLogicStore,
} from '../../../adminLogicStore'
import { useAdminFormLogic } from '../../../hooks/useAdminFormLogic'

import { FieldLogicBadge } from './FieldLogicBadge'
import { LogicBadge } from './LogicBadge'
import { LogicConditionValues } from './LogicConditionValues'

interface InactiveLogicBlockProps {
  logic: LogicDto
}

export const InactiveLogicBlock = ({
  logic,
}: InactiveLogicBlockProps): JSX.Element | null => {
  const { idToFieldMap } = useAdminFormLogic()
  const setToEditing = useAdminLogicStore(setToEditingSelector)
  const stateData = useAdminLogicStore(createOrEditDataSelector)
  const requestSwitchTo = useAdminLogicStore(requestSwitchToSelector)

  const isEditableCards = useFeatureIsOn(featureFlags.editableCardsMrfLogic)

  // Flag off: block editing while another logic block is open (previous
  // behaviour).
  const isPreventEdit = !isEditableCards && !!stateData

  const renderThenContent = useMemo(() => {
    if (!idToFieldMap) return null

    switch (logic.logicType) {
      case LogicType.ShowFields: {
        const allInvalid = logic.show.every(
          (fieldId) => !(fieldId in idToFieldMap),
        )
        return (
          <>
            <Text>then show</Text>
            <Stack direction="column" spacing="0.25rem">
              {allInvalid ? (
                <FieldLogicBadge
                  defaults={{
                    variant: 'error',
                    message:
                      'All fields were deleted, please select at least one field',
                  }}
                />
              ) : (
                logic.show.map((fieldId, index) => (
                  <FieldLogicBadge
                    key={index}
                    field={idToFieldMap[fieldId]}
                    defaults={{
                      variant: 'info',
                      message:
                        'This field was deleted and has been removed from your logic',
                    }}
                  />
                ))
              )}
            </Stack>
          </>
        )
      }
      case LogicType.PreventSubmit:
        return (
          <>
            <Text>then disable submission</Text>
            <LogicBadge>{logic.preventSubmitMessage}</LogicBadge>
          </>
        )
    }
  }, [logic, idToFieldMap])

  const handleClick = useCallback(() => {
    if (stateData) {
      // Another logic block is open: auto-save it and switch here when the flag
      // is on; otherwise editing is blocked.
      if (isEditableCards) {
        requestSwitchTo(logic._id)
      }
      return
    }
    setToEditing(logic._id)
  }, [isEditableCards, stateData, logic._id, setToEditing, requestSwitchTo])

  if (!idToFieldMap) return null

  return (
    <Box pos="relative" role={isEditableCards ? 'group' : undefined}>
      <Box
        w="100%"
        textAlign="start"
        borderRadius="4px"
        bg="white"
        border="1px solid"
        borderColor="neutral.300"
        transitionProperty="common"
        transitionDuration="normal"
        cursor={
          isEditableCards ? 'pointer' : isPreventEdit ? 'not-allowed' : 'auto'
        }
        aria-disabled={isPreventEdit}
        _groupHover={
          isEditableCards
            ? { borderColor: 'primary.500', bg: 'primary.100' }
            : undefined
        }
        onClick={isEditableCards ? handleClick : undefined}
      >
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
                <FieldLogicBadge
                  field={idToFieldMap[condition.field]}
                  defaults={{
                    variant: 'error',
                    message:
                      'This field was deleted, please select another field',
                  }}
                />
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
      </Box>
      <IconButton
        top={{ base: '0.5rem', md: '2rem' }}
        right={{ base: '0.5rem', md: '2rem' }}
        pos="absolute"
        aria-label="Delete logic"
        variant="clear"
        onClick={handleClick}
        icon={<BiPencil fontSize="1.5rem" />}
        cursor={isPreventEdit ? 'not-allowed' : 'pointer'}
        aria-disabled={isPreventEdit}
        color={isEditableCards ? 'neutral.500' : undefined}
        _groupHover={isEditableCards ? { color: 'primary.500' } : undefined}
      />
    </Box>
  )
}
