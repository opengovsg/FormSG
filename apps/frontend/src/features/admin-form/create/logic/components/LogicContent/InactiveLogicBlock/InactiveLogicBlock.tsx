import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BiPencil } from 'react-icons/bi'
import {
  Box,
  chakra,
  Divider,
  Icon,
  Stack,
  StackDivider,
  Text,
} from '@chakra-ui/react'

import { LogicDto, LogicType } from 'formsg-shared/types/form'

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
  const { t } = useTranslation()
  const { idToFieldMap } = useAdminFormLogic()
  const setToEditing = useAdminLogicStore(setToEditingSelector)
  const stateData = useAdminLogicStore(createOrEditDataSelector)
  const requestSwitchTo = useAdminLogicStore(requestSwitchToSelector)

  const renderThenContent = useMemo(() => {
    if (!idToFieldMap) return null

    switch (logic.logicType) {
      case LogicType.ShowFields: {
        const allInvalid = logic.show.every(
          (fieldId) => !(fieldId in idToFieldMap),
        )
        return (
          <>
            <Text>
              {t('features.adminForm.sidebar.logic.inactiveBlock.thenShow')}
            </Text>
            <Stack direction="column" spacing="0.25rem">
              {allInvalid ? (
                <FieldLogicBadge
                  defaults={{
                    variant: 'error',
                    message: t(
                      'features.adminForm.sidebar.logic.thenBlock.errors.atLeastOneFieldRequired',
                    ),
                  }}
                />
              ) : (
                logic.show.map((fieldId, index) => (
                  <FieldLogicBadge
                    key={index}
                    field={idToFieldMap[fieldId]}
                    defaults={{
                      variant: 'info',
                      message: t(
                        'features.adminForm.sidebar.logic.inactiveBlock.fieldRemoved',
                      ),
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
            <Text>
              {t(
                'features.adminForm.sidebar.logic.inactiveBlock.thenDisableSubmission',
              )}
            </Text>
            <LogicBadge>{logic.preventSubmitMessage}</LogicBadge>
          </>
        )
    }
  }, [logic, idToFieldMap, t])

  const handleClick = useCallback(() => {
    if (stateData) {
      // Another logic block is open: auto-save it and switch here.
      requestSwitchTo(logic._id)
      return
    }
    setToEditing(logic._id)
  }, [stateData, logic._id, setToEditing, requestSwitchTo])

  if (!idToFieldMap) return null

  return (
    <Box pos="relative" role="group">
      <chakra.button
        // The whole card is the control, so it must be a real button to get
        // focus and Enter/Space for free.
        type="button"
        w="100%"
        textAlign="start"
        borderRadius="4px"
        bg="white"
        border="1px solid"
        borderColor="neutral.300"
        transitionProperty="common"
        transitionDuration="normal"
        cursor="pointer"
        _groupHover={{ borderColor: 'primary.500', bg: 'primary.100' }}
        // chakra.button is unstyled, and the card is now the only control on
        // the block, so it has to supply its own focus ring.
        _focusVisible={{
          boxShadow: '0 0 0 2px var(--chakra-colors-neutral-500)',
        }}
        onClick={handleClick}
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
                <Text>
                  {index === 0
                    ? t('features.adminForm.sidebar.logic.inactiveBlock.if')
                    : t('features.adminForm.sidebar.logic.and')}
                </Text>
                <FieldLogicBadge
                  field={idToFieldMap[condition.field]}
                  defaults={{
                    variant: 'error',
                    message: t(
                      'features.adminForm.sidebar.logic.errors.fieldDeleted',
                    ),
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
      </chakra.button>
      {/* Visual affordance only: the whole card is the button, so the pencil
      must not swallow clicks or add a second target for AT. */}
      <Icon
        as={BiPencil}
        aria-hidden
        pointerEvents="none"
        top={{ base: '0.5rem', md: '2rem' }}
        right={{ base: '0.5rem', md: '2rem' }}
        pos="absolute"
        fontSize="1.5rem"
        color="neutral.500"
        transitionProperty="common"
        transitionDuration="normal"
        _groupHover={{ color: 'primary.500' }}
      />
    </Box>
  )
}
