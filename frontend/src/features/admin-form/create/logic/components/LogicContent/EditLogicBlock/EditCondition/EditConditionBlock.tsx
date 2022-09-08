import { useCallback, useEffect, useMemo } from 'react'
import {
  Controller,
  ControllerRenderProps,
  UseFormReturn,
} from 'react-hook-form'
import { BiTrash } from 'react-icons/bi'
import {
  Box,
  Flex,
  FormControl,
  Grid,
  Stack,
  VisuallyHidden,
} from '@chakra-ui/react'
import { Dictionary, get, pickBy, range } from 'lodash'

import { LOGIC_MAP } from '~shared/modules/logic'
import { BasicField } from '~shared/types/field'
import { LogicIfValue, LogicType } from '~shared/types/form'

import { useHasChanged } from '~hooks/useHasChanged'
import { useWatchDependency } from '~hooks/useWatchDependency'
import { convertToStringArray } from '~utils/stringFormat'
import { MultiSelect, SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import IconButton from '~components/IconButton'
import NumberInput from '~components/NumberInput'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { EditLogicInputs } from '~features/admin-form/create/logic/types'
import { FormFieldWithQuestionNo } from '~features/form/types'
import { getIfLogicType } from '~features/logic/utils'

import { BlockLabelText } from './BlockLabelText'

export interface EditConditionBlockProps {
  index: number
  isLoading: boolean
  handleRemoveCondition?: (index?: number | number[] | undefined) => void
  formMethods: UseFormReturn<EditLogicInputs>
  logicableFields: Dictionary<FormFieldWithQuestionNo> | null
  mapIdToField: Record<string, FormFieldWithQuestionNo> | null
}

export const EditConditionBlock = ({
  index,
  isLoading,
  handleRemoveCondition,
  formMethods,
  logicableFields,
  mapIdToField,
}: EditConditionBlockProps): JSX.Element => {
  const name = useMemo(() => `conditions.${index}` as const, [index])

  const {
    watch,
    formState: { errors },
    resetField,
    register,
    setValue,
    control,
    setError,
  } = formMethods
  const ifFieldIdValue = watch(`${name}.field`)
  const hasFieldIdChanged = useHasChanged(
    ifFieldIdValue,
    /* isIgnoreUndefined= */ true,
  )
  const conditionStateValue = watch(`${name}.state`)
  const ifValueTypeValue = watch(`${name}.ifValueType`)
  const logicTypeValue = watch('logicType')
  const showValueWatch = useWatchDependency(watch, 'show')
  const currentSelectedField = useMemo(() => {
    if (!ifFieldIdValue || !mapIdToField) return
    return mapIdToField[ifFieldIdValue]
  }, [ifFieldIdValue, mapIdToField])

  /**
   * Effect to set value and error if the user conditions on a deleted field.
   */
  useEffect(() => {
    if (!ifFieldIdValue || !mapIdToField) return
    if (!(ifFieldIdValue in mapIdToField)) {
      resetField(`${name}.field`)
      setError(`${name}.field`, {
        type: 'manual',
        message: 'This field was deleted, please select another field',
      })
    }
  }, [ifFieldIdValue, mapIdToField, name, resetField, setError])

  /**
   * Effect to reset the field if the field to apply a condition on is changed.
   */
  useEffect(() => {
    if (hasFieldIdChanged) {
      resetField(`${name}.value`, { defaultValue: '' })
      resetField(`${name}.state`)
    }
  }, [hasFieldIdChanged, name, resetField])

  useEffect(() => {
    if (!currentSelectedField) {
      resetField(`${name}.ifValueType`)
      return
    }
    setValue(
      `${name}.ifValueType`,
      getIfLogicType({
        fieldType: currentSelectedField.fieldType,
        conditionState: conditionStateValue,
      }),
    )
  }, [conditionStateValue, currentSelectedField, name, resetField, setValue])

  const allowedIfConditionFieldsOptions = useMemo(() => {
    if (!logicableFields) return []

    // Get subset of logicableFields that have not already been set to show on
    // other logic conditions.
    let subsetLogicableFields = logicableFields
    if (logicTypeValue === LogicType.ShowFields) {
      const thenValuesSet = new Set(showValueWatch.value)
      subsetLogicableFields = pickBy(
        subsetLogicableFields,
        (f) => !thenValuesSet.has(f._id),
      )
    }

    return Object.entries(subsetLogicableFields).map(([key, value]) => ({
      label: `${value.questionNumber}. ${value.title}`,
      value: key,
      icon: BASICFIELD_TO_DRAWER_META[value.fieldType].icon,
    }))
  }, [logicableFields, logicTypeValue, showValueWatch])

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
        if (mappedField.othersRadioButton) {
          // 'Others' does not show up in fieldOptions
          return mappedField.fieldOptions.concat('Others')
        }
        return mappedField.fieldOptions
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
      case BasicField.YesNo:
        return '9rem'
      default:
        return '14rem'
    }
  }, [currentSelectedField])

  const validateValueInputComponent = useCallback(
    (val) => {
      switch (ifValueTypeValue) {
        case LogicIfValue.Number: {
          if (currentSelectedField?.fieldType === BasicField.Decimal)
            // Mimics behavior of actual decimal field in public forms
            return !val || !isNaN(Number(val)) || 'Please enter a valid decimal'
          return true
        }
        default:
          return true
      }
    },
    [currentSelectedField?.fieldType, ifValueTypeValue],
  )

  const renderValueInputComponent = useCallback(
    (field: ControllerRenderProps<EditLogicInputs, `${typeof name}.value`>) => {
      const selectProps = {
        isDisabled: !conditionStateValue || isLoading,
        placeholder: null,
        isClearable: false,
        items: conditionValueItems,
      }
      const { value, ...rest } = field

      switch (ifValueTypeValue) {
        case LogicIfValue.SingleSelect:
          return (
            <SingleSelect {...selectProps} value={String(value)} {...rest} />
          )
        case LogicIfValue.MultiSelect:
          return (
            <MultiSelect
              {...selectProps}
              values={convertToStringArray(value)}
              {...rest}
            />
          )
        case LogicIfValue.Number: {
          if (currentSelectedField?.fieldType === BasicField.Number)
            return (
              <NumberInput
                inputMode="numeric"
                isDisabled={!conditionStateValue}
                value={String(value ?? '')}
                {...rest}
                onChange={(val) => {
                  // Only allow numeric inputs, mimics behavior of NumberField
                  rest.onChange(val.replace(/\D/g, ''))
                }}
                min={0}
              />
            )
          return (
            <NumberInput
              isDisabled={!conditionStateValue}
              value={String(value ?? '')}
              {...rest}
            />
          )
        }
        case undefined:
          return (
            <SingleSelect
              {...selectProps}
              value={String(value)}
              {...rest}
              isDisabled
            />
          )
      }
    },
    [
      conditionStateValue,
      conditionValueItems,
      currentSelectedField?.fieldType,
      ifValueTypeValue,
      isLoading,
    ],
  )

  return (
    <Flex flexDir="column">
      <Stack direction="column" spacing="0.75rem">
        <Grid
          columnGap="0.5rem"
          gridTemplateColumns={{
            base: '1fr auto',
            md: handleRemoveCondition ? 'auto 1fr auto' : 'auto 1fr',
          }}
          gridTemplateAreas={{
            base: "'label delete' 'input input'",
            md: handleRemoveCondition
              ? "'label input delete'"
              : "'label input'",
          }}
        >
          <BlockLabelText id={`${name}.field-label`} htmlFor={`${name}.field`}>
            IF
          </BlockLabelText>
          {handleRemoveCondition ? (
            <IconButton
              gridArea="delete"
              isDisabled={isLoading}
              variant="clear"
              colorScheme="danger"
              icon={<BiTrash />}
              onClick={() => handleRemoveCondition(index)}
              aria-label="Remove logic condition block"
            />
          ) : null}
          <FormControl
            gridArea="input"
            id={`${name}.field`}
            isRequired
            isReadOnly={isLoading}
            isInvalid={!!get(errors, `${name}.field`)}
          >
            <Controller
              control={control}
              name={`${name}.field`}
              rules={{
                required: 'Please select a question.',
                validate: (value) =>
                  !logicableFields ||
                  Object.keys(logicableFields).includes(value) ||
                  'Field is invalid or unable to accept logic.',
              }}
              render={({ field }) => (
                <SingleSelect
                  isDisabled={isLoading}
                  isClearable={false}
                  placeholder="Select a question"
                  items={allowedIfConditionFieldsOptions}
                  {...field}
                />
              )}
            />
            <FormErrorMessage>
              {get(errors, `${name}.field.message`)}
            </FormErrorMessage>
          </FormControl>
        </Grid>
        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={{ base: 0, md: '0.5rem' }}
        >
          <BlockLabelText id={`${name}.state-label`} htmlFor={`${name}.state`}>
            IS
          </BlockLabelText>
          <Flex flexDir="column" flex={1} as="fieldset" minW={0}>
            <VisuallyHidden as="legend">Logic criteria</VisuallyHidden>
            <Stack
              direction={{ base: 'column', md: 'row' }}
              align="flex-start"
              flex={1}
            >
              <FormControl
                id={`${name}.state`}
                isReadOnly={isLoading}
                isRequired
                isInvalid={!!get(errors, `${name}.state`)}
                maxW={{ md: logicTypeWrapperWidth }}
              >
                <Controller
                  control={control}
                  name={`${name}.state`}
                  rules={{
                    required: 'Please select a condition',
                  }}
                  render={({ field }) => (
                    <SingleSelect
                      placeholder={null}
                      isDisabled={!ifFieldIdValue || isLoading}
                      isClearable={false}
                      items={conditionItems}
                      {...field}
                    />
                  )}
                />
              </FormControl>
              <FormControl
                id={`${name}.value`}
                isRequired
                isReadOnly={isLoading}
                isInvalid={!!get(errors, `${name}.value`)}
              >
                <VisuallyHidden
                  as="label"
                  id={`${name}.value-label`}
                  htmlFor={`${name}.value`}
                >
                  Logic condition
                </VisuallyHidden>
                <Controller
                  control={control}
                  name={`${name}.value`}
                  rules={{
                    required: 'Please enter logic criteria.',
                    validate: validateValueInputComponent,
                  }}
                  render={({ field }) => renderValueInputComponent(field)}
                />
              </FormControl>
            </Stack>
            <FormControl
              isInvalid={
                !!(get(errors, `${name}.state`) ?? get(errors, `${name}.value`))
              }
            >
              <FormErrorMessage>
                {get(errors, `${name}.state.message`) ??
                  get(errors, `${name}.value.message`)}
              </FormErrorMessage>
            </FormControl>
          </Flex>
          {handleRemoveCondition ? <Box aria-hidden w="2.75rem" /> : null}
        </Stack>
        {/* Virtual input for ifLogicType field */}
        <input type="hidden" {...register(`${name}.ifValueType`)} aria-hidden />
      </Stack>
    </Flex>
  )
}
