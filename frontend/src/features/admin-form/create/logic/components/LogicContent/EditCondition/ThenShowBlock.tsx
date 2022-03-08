import { useEffect, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { BiShow, BiX } from 'react-icons/bi'
import { FormControl, Stack } from '@chakra-ui/react'

import { LogicType } from '~shared/types/form'

import { useWatchDependency } from '~hooks/useWatchDependency'
import { MultiSelect, SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

import { useAdminFormLogic } from '../../../hooks/useAdminFormLogic'

import { BlockLabelText } from './BlockLabelText'
import { EditLogicInputs, LOGIC_FIELD_ARRAY_NAME } from './EditConditionBlock'

export const ThenShowBlock = (): JSX.Element => {
  const {
    watch,
    formState: { errors },
    resetField,
  } = useFormContext<EditLogicInputs>()

  const { formFields, mapIdToField } = useAdminFormLogic()

  const thenTypeValue = watch('thenType')
  const logicConditionsWatch = useWatchDependency(watch, LOGIC_FIELD_ARRAY_NAME)

  const thenTypeItems = useMemo(() => {
    return [
      {
        label: 'Show field(s)',
        value: LogicType.ShowFields,
        icon: BiShow,
      },
      {
        label: 'Disable submission',
        value: LogicType.PreventSubmit,
        icon: BiX,
      },
    ]
  }, [])

  const thenValueItems = useMemo(() => {
    // Return every field except fields that are already used in the logic.
    if (thenTypeValue === LogicType.ShowFields) {
      const usedFieldIds = new Set(
        logicConditionsWatch.value.map((condition) => condition.ifFieldId),
      )
      if (!formFields || !mapIdToField) return []
      return formFields
        .filter((f) => !usedFieldIds.has(f._id))
        .map((f) => {
          const mappedField = mapIdToField[f._id]
          return {
            value: f._id,
            label: `${mappedField.questionNumber}. ${mappedField.title}`,
            icon: BASICFIELD_TO_DRAWER_META[f.fieldType].icon,
          }
        })
    }
    return []
    // Watch entire <***>Watch variables since <***>Watch.value is a proxy
    // and will not update if <***>Watch.value is mutated.
  }, [formFields, logicConditionsWatch, mapIdToField, thenTypeValue])

  /**
   * Effect to reset the logic values if the logic type is changed.
   */
  useEffect(() => {
    if (thenTypeValue) {
      resetField('thenValue')
    }
  }, [resetField, thenTypeValue])

  return (
    <Stack direction="column" spacing="0.75rem" py="1.5rem" px="2rem">
      <Stack direction="row" spacing="0.5rem">
        <BlockLabelText>Then</BlockLabelText>
        <FormControl id="thenType" isRequired isInvalid={!!errors.thenType}>
          <Controller
            name="thenType"
            rules={{
              required: 'Please select logic type.',
            }}
            render={({ field }) => (
              <SingleSelect
                isSearchable={false}
                isClearable={false}
                placeholder="Select a type of result"
                items={thenTypeItems}
                {...field}
              />
            )}
          />
          <FormErrorMessage>{errors.thenType?.message}</FormErrorMessage>
        </FormControl>
      </Stack>

      <Stack direction="row" spacing="0.5rem">
        <BlockLabelText>Show</BlockLabelText>
        <FormControl id="thenValue" isRequired isInvalid={!!errors.thenValue}>
          <Controller
            name="thenValue"
            rules={{
              required:
                'Please select fields to show if logic criteria is met.',
            }}
            render={({ field: { value, ...field } }) => (
              <MultiSelect
                placeholder={null}
                items={thenValueItems}
                values={value ?? []}
                {...field}
              />
            )}
          />
          <FormErrorMessage>{errors.thenType?.message}</FormErrorMessage>
        </FormControl>
      </Stack>
    </Stack>
  )
}
