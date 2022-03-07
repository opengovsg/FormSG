import { useEffect, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Flex, FormControl, Stack, Text } from '@chakra-ui/react'
import { get, range } from 'lodash'

import { LOGIC_MAP } from '~shared/modules/logic'
import { BasicField } from '~shared/types/field'
import { LogicConditionState } from '~shared/types/form'

import { SingleSelect } from '~components/Dropdown/SingleSelect'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

import { useAdminFormLogic } from '../../../hooks/useAdminFormLogic'

import { BlockLabelText } from './BlockLabelText'

export interface EditConditionBlockProps {
  index: number
}

export type EditLogicBlockInputs = {
  ifFieldId: string
  logicCondition: LogicConditionState
  logicValue: string
}
export const LOGIC_FIELD_ARRAY_NAME = 'logicConditions'

export type EditLogicInputs = {
  [LOGIC_FIELD_ARRAY_NAME]: EditLogicBlockInputs[]
}

export const EditConditionBlock = ({
  index,
}: EditConditionBlockProps): JSX.Element => {
  const { logicableFields, mapIdToField } = useAdminFormLogic()
  const name = useMemo(
    () => `${LOGIC_FIELD_ARRAY_NAME}.${index}` as const,
    [index],
  )

  const {
    watch,
    formState: { errors },
    resetField,
  } = useFormContext<EditLogicInputs>()
  const ifFieldIdValue = watch(`${name}.ifFieldId`)

  /**
   * Effect to reset the field if the field to apply a condition on is changed.
   */
  useEffect(() => {
    if (ifFieldIdValue) {
      resetField(`${name}.logicValue`)
      resetField(`${name}.logicCondition`)
    }
  }, [ifFieldIdValue, name, resetField])

  const items = useMemo(() => {
    if (!logicableFields) return []
    return Object.entries(logicableFields).map(([key, value]) => ({
      label: `${value.questionNumber}. ${value.title}`,
      value: key,
      icon: BASICFIELD_TO_DRAWER_META[value.fieldType].icon,
    }))
  }, [logicableFields])

  const conditionItems = useMemo(() => {
    if (!ifFieldIdValue || !mapIdToField) return []
    const mappedField = mapIdToField[ifFieldIdValue]
    return LOGIC_MAP.get(mappedField.fieldType)?.map(String) ?? []
  }, [ifFieldIdValue, mapIdToField])

  const conditionValueItems = useMemo(() => {
    if (!ifFieldIdValue || !mapIdToField) return []
    const mappedField = mapIdToField[ifFieldIdValue]
    if (!mappedField) return []
    switch (mappedField.fieldType) {
      case BasicField.YesNo:
        return ['Yes', 'No']
      case BasicField.Radio:
      case BasicField.Dropdown:
        return mappedField.fieldOptions
      case BasicField.Rating:
        return range(1, mappedField.ratingOptions.steps + 1).map(String)
      default:
        return []
    }
  }, [ifFieldIdValue, mapIdToField])

  return (
    <Flex flexDir="column">
      <Stack direction="column" spacing="0.75rem">
        <Flex>
          <BlockLabelText htmlFor={`${name}.ifFieldId`}>IF</BlockLabelText>
          <FormControl
            id={`${name}.ifFieldId`}
            isRequired
            isInvalid={!!get(errors, `${name}.ifFieldId`)}
          >
            <Controller
              name={`${name}.ifFieldId`}
              rules={{
                required: true,
                validate: (value) =>
                  !logicableFields ||
                  Object.keys(logicableFields).includes(value),
              }}
              render={({ field }) => (
                <SingleSelect isSearchable={false} items={items} {...field} />
              )}
            />
          </FormControl>
        </Flex>
        <Flex>
          <BlockLabelText htmlFor={`${name}.logicCondition`}>IS</BlockLabelText>
          <Stack direction="row" align="center">
            <FormControl
              id={`${name}.logicCondition`}
              isRequired
              isInvalid={!!get(errors, `${name}.logicCondition`)}
            >
              <Controller
                name={`${name}.logicCondition`}
                rules={{
                  required: true,
                }}
                render={({ field }) => (
                  <SingleSelect
                    isDisabled={!ifFieldIdValue}
                    isSearchable={false}
                    items={conditionItems}
                    {...field}
                  />
                )}
              />
            </FormControl>
            <FormControl
              id={`${name}.logicValue`}
              isRequired
              isInvalid={!!get(errors, `${name}.logicValue`)}
            >
              <Controller
                name={`${name}.logicValue`}
                rules={{
                  required: true,
                }}
                render={({ field }) => (
                  <SingleSelect
                    isDisabled={!ifFieldIdValue}
                    isSearchable={false}
                    items={conditionValueItems}
                    {...field}
                  />
                )}
              />
            </FormControl>
          </Stack>
        </Flex>
      </Stack>
    </Flex>
  )
}
