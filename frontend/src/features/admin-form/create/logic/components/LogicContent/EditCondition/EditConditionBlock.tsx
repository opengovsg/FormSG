import { useCallback, useEffect, useMemo } from 'react'
import {
  Controller,
  ControllerRenderProps,
  FieldValues,
  useFormContext,
} from 'react-hook-form'
import { BiTrash } from 'react-icons/bi'
import { Box, Flex, FormControl, Stack } from '@chakra-ui/react'
import { get, range } from 'lodash'

import { LOGIC_MAP } from '~shared/modules/logic'
import { BasicField } from '~shared/types/field'
import { LogicConditionState, LogicType } from '~shared/types/form'

import { MultiSelect, SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import IconButton from '~components/IconButton'
import NumberInput from '~components/NumberInput'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

import { useAdminFormLogic } from '../../../hooks/useAdminFormLogic'

import { BlockLabelText } from './BlockLabelText'

export interface EditConditionBlockProps {
  index: number
  handleRemoveLogic?: (index?: number | number[] | undefined) => void
}

export type EditLogicBlockInputs = {
  ifFieldId: string
  logicCondition: LogicConditionState
  logicValue: string | string[]
}
export const LOGIC_FIELD_ARRAY_NAME = 'logicConditions'

export type EditLogicInputs = {
  [LOGIC_FIELD_ARRAY_NAME]: EditLogicBlockInputs[]
  thenType: LogicType
  thenValue: string | string[]
}

export const EditConditionBlock = ({
  index,
  handleRemoveLogic,
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
  const logicConditionValue = watch(`${name}.logicCondition`)

  const currentSelectedField = useMemo(() => {
    if (!ifFieldIdValue || !mapIdToField) return
    return mapIdToField[ifFieldIdValue]
  }, [ifFieldIdValue, mapIdToField])

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
    if (!currentSelectedField) return []
    return (
      LOGIC_MAP.get(currentSelectedField.fieldType)?.map((v) => ({
        // Remove leading 'is' from the condition name for rendering.
        label: v.replace(/^is\s/i, ''),
        value: v,
      })) ?? []
    )
  }, [currentSelectedField])

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

  const logicTypeWrapperWidth = useMemo(() => {
    if (!currentSelectedField) return '9rem'
    switch (currentSelectedField.fieldType) {
      case BasicField.Dropdown:
      case BasicField.Radio:
      case BasicField.Rating:
      case BasicField.YesNo:
        return '9rem'
      default:
        return '14rem'
    }
  }, [currentSelectedField])

  const renderValueInputComponent = useCallback(
    (
      field: ControllerRenderProps<FieldValues, `${typeof name}.logicValue`>,
    ) => {
      const selectProps = {
        isDisabled: !logicConditionValue,
        isSearchable: false,
        placeholder: null,
        isClearable: false,
        items: conditionValueItems,
      }

      if (!currentSelectedField)
        return <SingleSelect {...selectProps} {...field} isDisabled />

      switch (currentSelectedField.fieldType) {
        case BasicField.Dropdown:
        case BasicField.Radio: {
          if (
            !logicConditionValue ||
            logicConditionValue === LogicConditionState.Equal
          ) {
            return <SingleSelect {...selectProps} {...field} />
          }
          const { value, ...rest } = field
          return <MultiSelect {...selectProps} values={value ?? []} {...rest} />
        }
        case BasicField.Rating:
        case BasicField.YesNo:
          return <SingleSelect {...selectProps} {...field} />
        default:
          return <NumberInput isDisabled={!logicConditionValue} {...field} />
      }
    },
    [conditionValueItems, currentSelectedField, logicConditionValue],
  )

  return (
    <Flex flexDir="column">
      <Stack direction="column" spacing="0.75rem">
        <Stack direction="row" spacing="0.5rem">
          <BlockLabelText htmlFor={`${name}.ifFieldId`}>IF</BlockLabelText>
          <FormControl
            id={`${name}.ifFieldId`}
            isRequired
            isInvalid={!!get(errors, `${name}.ifFieldId`)}
          >
            <Controller
              name={`${name}.ifFieldId`}
              rules={{
                required: 'Please select a question.',
                validate: (value) =>
                  !logicableFields ||
                  Object.keys(logicableFields).includes(value) ||
                  'Field is invalid or unable to accept logic.',
              }}
              render={({ field }) => (
                <SingleSelect
                  isSearchable={false}
                  isClearable={false}
                  placeholder="Select a question"
                  items={items}
                  {...field}
                />
              )}
            />
            <FormErrorMessage>
              {get(errors, `${name}.ifFieldId.message`)}
            </FormErrorMessage>
          </FormControl>
          {handleRemoveLogic ? (
            <IconButton
              variant="clear"
              colorScheme="danger"
              icon={<BiTrash />}
              onClick={() => handleRemoveLogic(index)}
              aria-label="Remove logic block"
            />
          ) : null}
        </Stack>
        <Stack direction="row" spacing="0.5rem">
          <BlockLabelText htmlFor={`${name}.logicCondition`}>IS</BlockLabelText>
          <Flex flexDir="column" flex={1}>
            <Stack direction="row" align="flex-start" flex={1}>
              <FormControl
                id={`${name}.logicCondition`}
                isRequired
                isInvalid={!!get(errors, `${name}.logicCondition`)}
                maxW={logicTypeWrapperWidth}
              >
                <Controller
                  name={`${name}.logicCondition`}
                  rules={{
                    required: 'Please select a condition',
                  }}
                  render={({ field }) => (
                    <SingleSelect
                      placeholder={null}
                      isDisabled={!ifFieldIdValue}
                      isSearchable={false}
                      isClearable={false}
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
                    required: 'Please enter logic criteria.',
                  }}
                  render={({ field }) => renderValueInputComponent(field)}
                />
              </FormControl>
            </Stack>
            <FormControl
              isInvalid={
                !!(
                  get(errors, `${name}.logicCondition`) ??
                  get(errors, `${name}.logicValue`)
                )
              }
            >
              <FormErrorMessage>
                {get(errors, `${name}.logicCondition.message`) ??
                  get(errors, `${name}.logicValue.message`)}
              </FormErrorMessage>
            </FormControl>
          </Flex>
          {handleRemoveLogic ? <Box aria-hidden w="2.75rem" /> : null}
        </Stack>
      </Stack>
    </Flex>
  )
}
